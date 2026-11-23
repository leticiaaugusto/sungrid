/**
 * AuthService: regras de autenticação e conta do usuário.
 *
 * Regras atendidas:
 *  RN01 login com e-mail e senha    RN02 dados obrigatórios do cadastro
 *  RN03 e-mail único                RN04 domínios corporativos (opcional)
 *  RN05 token de uso único          RN06 não revelar se o e-mail existe
 *  RNF14 LGPD: exportar e excluir os próprios dados
 */
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { ambiente } from '../../config/ambiente.js'
import { emTransacao } from '../../config/banco.js'
import { erros } from '../../compartilhado/erros.js'
import { ACOES_AUDITADAS } from '../auditoria/Auditoria.js'
import { AuditoriaService } from '../auditoria/AuditoriaService.js'
import { auditoriaRepositorio } from '../auditoria/auditoriaRepositorio.js'
import { emailServico } from './emailServico.js'
import { TokenRecuperacao } from './TokenRecuperacao.js'
import { tokenRecuperacaoRepositorio } from './tokenRecuperacaoRepositorio.js'
import { Usuario } from './Usuario.js'
import { usuarioRepositorio } from './usuarioRepositorio.js'

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TAMANHO_MINIMO_SENHA = 8

/** Mensagem única para login inválido: não diz se o erro foi no e-mail ou na senha. */
const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha inválidos.'

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function validarSenha(senha, confirmacaoSenha) {
  if (!senha) throw erros.requisicaoInvalida('Informe a senha.', 'senha')
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    throw erros.requisicaoInvalida(`A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`, 'senha')
  }
  if (senha !== confirmacaoSenha) {
    throw erros.requisicaoInvalida('As senhas não coincidem.', 'confirmacaoSenha')
  }
}

function gerarJwt(usuario) {
  return jwt.sign({ papel: usuario.papel }, ambiente.jwt.segredo, {
    subject: String(usuario.id),
    expiresIn: ambiente.jwt.expiracao,
  })
}

export const AuthService = {
  /** RN01: autentica e devolve o token JWT + dados do usuário. */
  async login({ email, senha }, ip) {
    email = texto(email)
    if (!email || !senha) {
      throw erros.requisicaoInvalida('Informe e-mail e senha.')
    }

    const usuario = await usuarioRepositorio.buscarPorEmail(email)
    const senhaCorreta = usuario ? await usuario.verificarSenha(senha) : false

    if (!usuario || !senhaCorreta) {
      await AuditoriaService.registrar({
        usuarioId: usuario?.id,
        acao: ACOES_AUDITADAS.LOGIN_FALHOU,
        ip,
        detalhes: { email },
      })
      throw erros.naoAutenticado(MENSAGEM_LOGIN_INVALIDO)
    }

    await AuditoriaService.registrar({ usuarioId: usuario.id, acao: ACOES_AUDITADAS.LOGIN, ip })
    return { token: gerarJwt(usuario), usuario: usuario.paraResposta() }
  },

  /** RN02 / RN03 / RN04: cria a conta e aplica a regra do primeiro administrador. */
  async cadastrar({ nome, email, senha, confirmacaoSenha, perfil }) {
    nome = texto(nome)
    email = texto(email).toLowerCase()

    if (!nome) throw erros.requisicaoInvalida('Informe o nome completo.', 'nome')
    if (!email) throw erros.requisicaoInvalida('Informe o e-mail corporativo.', 'email')
    if (!FORMATO_EMAIL.test(email)) throw erros.requisicaoInvalida('Digite um endereço de e-mail válido.', 'email')
    validarSenha(senha, confirmacaoSenha)
    const perfilSelecionado = String(perfil ?? '').toUpperCase()
    if (!['OPERADOR', 'ADMINISTRADOR'].includes(perfilSelecionado)) {
      throw erros.requisicaoInvalida('Selecione um perfil válido.', 'perfil')
    }

    const dominio = email.split('@')[1]
    if (ambiente.dominiosPermitidos.length > 0 && !ambiente.dominiosPermitidos.includes(dominio)) {
      throw erros.requisicaoInvalida('Use um e-mail de um domínio corporativo autorizado.', 'email')
    }

    if (await usuarioRepositorio.buscarPorEmail(email)) {
      throw erros.conflito('Já existe uma conta com este e-mail.', 'email')
    }

    const existeAdministrador = (await usuarioRepositorio.contarAdministradores()) > 0
    const papel = existeAdministrador ? 'OPERADOR' : 'ADMINISTRADOR'
    const papelSolicitado = existeAdministrador && perfilSelecionado === 'ADMINISTRADOR'
      ? 'ADMINISTRADOR'
      : null

    const usuario = await usuarioRepositorio.inserir({
      nome,
      email,
      senhaHash: await Usuario.gerarHashSenha(senha),
      papel,
      papelSolicitado,
    })
    const mensagem = papelSolicitado
      ? 'Conta criada como Operador. Seu pedido para Administrador aguarda aprovação de um administrador.'
      : 'Conta criada com sucesso. Você já pode entrar.'
    return { mensagem, usuario: usuario.paraResposta() }
  },

  /**
   * RN05 / RN06: gera o link de recuperação. A resposta é sempre a mesma,
   * exista ou não a conta, para não expor quem está cadastrado.
   */
  async solicitarRecuperacaoSenha({ email }) {
    email = texto(email)
    if (!FORMATO_EMAIL.test(email)) {
      throw erros.requisicaoInvalida('Digite um endereço de e-mail válido.', 'email')
    }

    const usuario = await usuarioRepositorio.buscarPorEmail(email)
    if (usuario) {
      await tokenRecuperacaoRepositorio.invalidarPendentes(usuario.id)
      const { token, entidade } = TokenRecuperacao.gerar(usuario.id, ambiente.tokenRecuperacaoMinutos)
      await tokenRecuperacaoRepositorio.inserir(entidade)
      await emailServico.enviarRecuperacaoSenha({
        para: usuario.email,
        nome: usuario.nome,
        link: `${ambiente.urlFrontend}/redefinir-senha?token=${token}`,
        validadeMinutos: ambiente.tokenRecuperacaoMinutos,
      })
    }

    return {
      mensagem: 'Se houver uma conta com este e-mail, enviaremos as instruções para redefinir sua senha.',
    }
  },

  /** RN05: grava a nova senha a partir do token do link (uso único). */
  async redefinirSenha({ token, senha, confirmacaoSenha }) {
    if (!token) throw erros.requisicaoInvalida('Link de recuperação inválido.')
    validarSenha(senha, confirmacaoSenha)
    const senhaHash = await Usuario.gerarHashSenha(senha)

    const usuarioId = await emTransacao(async (cliente) => {
      const registro = await tokenRecuperacaoRepositorio.buscarPorHash(TokenRecuperacao.calcularHash(token), cliente)
      if (!registro || !registro.estaValido()) {
        throw erros.requisicaoInvalida('Este link expirou ou já foi usado. Solicite um novo.')
      }
      registro.marcarComoUsado()
      await tokenRecuperacaoRepositorio.salvarUso(registro, cliente)
      await usuarioRepositorio.atualizarSenha(registro.usuarioId, senhaHash, cliente)
      return registro.usuarioId
    })

    await AuditoriaService.registrar({ usuarioId, acao: ACOES_AUDITADAS.SENHA_REDEFINIDA })
    return { mensagem: 'Senha redefinida com sucesso. Você já pode entrar.' }
  },

  /** RF07: dados do usuário logado para o topo das telas. */
  async usuarioLogado(usuarioId) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioId)
    if (!usuario) throw erros.naoAutenticado()
    return usuario.paraResposta()
  },

  /** Atualiza nome, cargo e foto da própria conta. */
  async atualizarMinhaConta(usuarioId, dados, ip) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioId)
    if (!usuario) throw erros.naoAutenticado()
    const nome = texto(dados.nome)
    if (!nome) throw erros.requisicaoInvalida('Informe o nome.', 'nome')
    const atualizado = await usuarioRepositorio.atualizarPerfil(usuarioId, {
      nome,
      cargo: texto(dados.cargo) || null,
      fotoUrl: texto(dados.fotoUrl) || null,
    })
    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.PERFIL_ATUALIZADO,
      alvo: { entidade: 'usuario', id: usuarioId },
      ip,
    })
    return atualizado.paraResposta()
  },

  /** Troca a senha após confirmar a senha atual. */
  async trocarMinhaSenha(usuarioId, dados, ip) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioId)
    if (!usuario) throw erros.naoAutenticado()
    const senhaAtualCorreta = await usuario.verificarSenha(texto(dados.senhaAtual))
    if (!senhaAtualCorreta) {
      throw erros.requisicaoInvalida('Senha atual incorreta.', 'senhaAtual')
    }
    validarSenha(dados.novaSenha, dados.confirmacaoSenha)
    await usuarioRepositorio.atualizarSenha(usuarioId, await Usuario.gerarHashSenha(dados.novaSenha))
    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.SENHA_ALTERADA,
      alvo: { entidade: 'usuario', id: usuarioId },
      ip,
    })
    return { mensagem: 'Senha alterada com sucesso.' }
  },

  /** Lista usuários para administradores. */
  async listarUsuarios() {
    return (await usuarioRepositorio.listarTodos()).map((usuario) => ({
      ...usuario.paraResposta(),
      criadoEm: usuario.criadoEm,
    }))
  },

  /** Altera perfil diretamente ou aprova/recusa pedido pendente. */
  async alterarPapel(usuarioIdAlvo, dados, usuarioSolicitante, ip) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioIdAlvo)
    if (!usuario) throw erros.naoEncontrado('Usuário não encontrado.')

    const pedido = String(dados.papel ?? '').toUpperCase()
    if (pedido === 'RECUSAR') {
      const atualizado = await usuarioRepositorio.definirPedido(usuarioIdAlvo, null)
      await AuditoriaService.registrar({
        usuarioId: usuarioSolicitante,
        acao: ACOES_AUDITADAS.PAPEL_ALTERADO,
        alvo: { entidade: 'usuario', id: usuarioIdAlvo },
        ip,
        detalhes: { pedido: 'RECUSADO' },
      })
      return atualizado.paraResposta()
    }

    if (!['OPERADOR', 'ADMINISTRADOR'].includes(pedido)) {
      throw erros.requisicaoInvalida('Perfil inválido.', 'papel')
    }
    if (usuario.papel === 'ADMINISTRADOR' && pedido !== 'ADMINISTRADOR') {
      if ((await usuarioRepositorio.contarAdministradores()) <= 1) {
        throw erros.conflito('Não é possível remover o papel do último administrador.')
      }
    }
    const atualizado = await usuarioRepositorio.alterarPapel(usuarioIdAlvo, pedido)
    await AuditoriaService.registrar({
      usuarioId: usuarioSolicitante,
      acao: ACOES_AUDITADAS.PAPEL_ALTERADO,
      alvo: { entidade: 'usuario', id: usuarioIdAlvo },
      ip,
      detalhes: { papelAnterior: usuario.papel, papelNovo: pedido },
    })
    return atualizado.paraResposta()
  },

  /** RNF14 (LGPD): devolve os dados pessoais e o histórico de ações do usuário. */
  async exportarDadosPessoais(usuarioId, ip) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioId)
    if (!usuario) throw erros.naoAutenticado()

    await AuditoriaService.registrar({ usuarioId, acao: ACOES_AUDITADAS.DADOS_PESSOAIS_EXPORTADOS, ip })
    return {
      geradoEm: new Date().toISOString(),
      usuario: { ...usuario.paraResposta(), criadoEm: usuario.criadoEm },
      acoesRegistradas: await auditoriaRepositorio.listarPorUsuario(usuarioId),
    }
  },

  /**
   * RNF14 (LGPD): exclui a conta e os dados pessoais.
   * Se o usuário abriu chamados, a conta é anonimizada em vez de apagada,
   * para não eliminar registros de atendimento necessários (seção 7).
   */
  async excluirConta(usuarioId, ip) {
    await emTransacao(async (cliente) => {
      const chamados = await usuarioRepositorio.contarChamadosAbertosPor(usuarioId, cliente)
      if (chamados > 0) {
        const senhaAleatoria = await Usuario.gerarHashSenha(crypto.randomBytes(32).toString('hex'))
        await usuarioRepositorio.anonimizar(usuarioId, senhaAleatoria, cliente)
      } else {
        await usuarioRepositorio.excluir(usuarioId, cliente)
      }
    })

    // Sem usuario_id: a conta pode não existir mais.
    await AuditoriaService.registrar({
      acao: ACOES_AUDITADAS.CONTA_EXCLUIDA,
      alvo: { entidade: 'usuario', id: usuarioId },
      ip,
    })
    return { mensagem: 'Conta e dados pessoais excluídos.' }
  },
}
