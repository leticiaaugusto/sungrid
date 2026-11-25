
import { erros } from '../../compartilhado/erros.js'
import { arredondar, hoje, somarDias } from '../../compartilhado/tempo.js'
import { ACOES_AUDITADAS } from '../auditoria/Auditoria.js'
import { AuditoriaService } from '../auditoria/AuditoriaService.js'
import { controleSimulacao } from '../simulador/controleSimulacao.js'
import { STATUS_ATIVO, TIPOS_ATIVO } from './Ativo.js'
import { ativoRepositorio } from './ativoRepositorio.js'
import { telemetriaRepositorio } from './telemetriaRepositorio.js'

const DIAS_HISTORICO_PADRAO = 7
const DIAS_HISTORICO_MAXIMO = 31
// Esta função busca os dados necessários.

async function buscarOuFalhar(id, usuarioId) {
  const numero = Number(id)
  const ativo = Number.isInteger(numero) ? await ativoRepositorio.buscarPorId(numero, usuarioId) : null
  if (!ativo) throw erros.naoEncontrado('Ativo não encontrado.')
  return ativo
}

function textoObrigatorio(valor, campo, mensagem) {
  const texto = typeof valor === 'string' ? valor.trim() : ''
  if (!texto) throw erros.requisicaoInvalida(mensagem, campo)
  return texto
}

function numeroOpcional(valor) {
  if (valor === null || valor === '' || valor === undefined) return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function validarDadosAtivo(dados) {
  const codigo = textoObrigatorio(dados.codigo, 'codigo', 'Informe o código do ativo.')
  const nome = textoObrigatorio(dados.nome, 'nome', 'Informe o nome do ativo.')
  const tipo = String(dados.tipo ?? '').toUpperCase()
  if (!TIPOS_ATIVO.includes(tipo)) throw erros.requisicaoInvalida('Tipo de ativo inválido.', 'tipo')
  const status = String(dados.status ?? 'OPERANDO').toUpperCase()
  if (!Object.values(STATUS_ATIVO).includes(status)) {
    throw erros.requisicaoInvalida('Status de ativo inválido.', 'status')
  }
  const faixa = dados.faixaOperacao ?? {}
  return {
    codigo,
    nome,
    tipo,
    fabricante: typeof dados.fabricante === 'string' ? dados.fabricante.trim() || null : null,
    status,
    instaladoEm: dados.instaladoEm || null,
    proximaManutencaoH: numeroOpcional(dados.proximaManutencaoH),
    temperaturaMaxC: numeroOpcional(faixa.temperaturaMaxC),
    tensaoNominalV: numeroOpcional(faixa.tensaoNominalV),
    toleranciaTensaoPct: numeroOpcional(faixa.toleranciaTensaoPct),
    correnteMaxA: numeroOpcional(faixa.correnteMaxA),
    eficienciaMinPct: numeroOpcional(faixa.eficienciaMinPct),
  }
}

// Esta constante disponibiliza AtivoService para outras partes do projeto.

export const AtivoService = {

  async buscar(termo, usuarioId) {
    termo = typeof termo === 'string' ? termo.trim() : ''
    const registros = await ativoRepositorio.listarComTelemetria(termo, usuarioId)
    return registros.map(({ ativo, potenciaAtualKw, atualizadoEm }) => {
      const resposta = ativo.paraResposta()
      const agora = Date.now()
      const atualizado = atualizadoEm ? new Date(atualizadoEm).getTime() : null
      return {
        ...resposta,
        potenciaAtualKw: potenciaAtualKw === null || potenciaAtualKw === undefined ? null : arredondar(potenciaAtualKw, 2),
        atualizadoEm,
        segundosDesdeAtualizacao: atualizado ? Math.max(0, Math.round((agora - atualizado) / 1000)) : null,
      }
    })
  },

  async detalhar(id, usuarioId) {
    return (await buscarOuFalhar(id, usuarioId)).paraResposta()
  },

  async telemetria(id, usuarioId) {
    const ativo = await buscarOuFalhar(id, usuarioId)
    const telemetria = await telemetriaRepositorio.buscarPorAtivo(ativo.id)
    if (!telemetria) {
      return { ativoId: ativo.id, disponivel: false, desatualizada: true, mensagem: 'Ativo ainda não enviou telemetria.' }
    }

    return {
      ativoId: ativo.id,
      disponivel: true,
      atualizadoEm: telemetria.atualizadoEm,
      segundosDesdeAtualizacao: telemetria.segundosDesdeAtualizacao(),
      desatualizada: telemetria.estaDesatualizada(),

      grandezaPrincipal: ativo.ehGerador() ? 'gerada' : 'consumida',
      valores: {
        potenciaGeradaKw: arredondar(telemetria.potenciaGeradaKw, 2),
        potenciaConsumidaKw: arredondar(telemetria.potenciaConsumidaKw, 2),
        temperaturaC: arredondar(telemetria.temperaturaC),
        tensaoV: arredondar(telemetria.tensaoV),
        correnteA: arredondar(telemetria.correnteA),
        eficienciaPct: arredondar(telemetria.eficienciaPct),
        cargaPct: arredondar(telemetria.cargaPct),
      },
      avaliacao: ativo.faixa.avaliar(telemetria),
    }
  },

  async historico(id, dias = DIAS_HISTORICO_PADRAO, usuarioId) {
    const ativo = await buscarOuFalhar(id, usuarioId)
    dias = Number(dias)
    if (!Number.isInteger(dias) || dias < 1 || dias > DIAS_HISTORICO_MAXIMO) {
      throw erros.requisicaoInvalida(`Informe dias entre 1 e ${DIAS_HISTORICO_MAXIMO}.`, 'dias')
    }

    const fim = hoje()
    const inicio = somarDias(fim, -(dias - 1))
    const grandeza = ativo.ehGerador() ? 'gerada' : 'consumida'
    const registros = await ativoRepositorio.historicoDiario(ativo.id, inicio, fim, grandeza)
    const porDia = new Map(registros.map((registro) => [registro.dia, registro]))

    const serie = []
    for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
      const registro = porDia.get(dia)
      serie.push({
        data: dia,

        potenciaMediaKw: arredondar(registro?.potenciaMediaKw ?? null, 2),
        potenciaMaximaKw: arredondar(registro?.potenciaMaximaKw ?? null, 2),
        energiaKwh: arredondar(registro?.energiaKwh ?? null, 1),
      })
    }
    return { ativoId: ativo.id, grandeza, dias: serie }
  },

  async criar(dados, usuarioId, ip) {
    const normalizados = validarDadosAtivo(dados)
    if (await ativoRepositorio.buscarCodigo(normalizados.codigo, usuarioId)) {
      throw erros.conflito('Já existe um ativo com este código.', 'codigo')
    }
    const ativo = await ativoRepositorio.inserir(normalizados, usuarioId)
    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.ATIVO_CRIADO,
      alvo: { entidade: 'ativo', id: ativo.id },
      ip,
    })
    return ativo.paraResposta()
  },

  async editar(id, dados, usuarioId, ip) {
    const atual = await buscarOuFalhar(id, usuarioId)
    const normalizados = validarDadosAtivo(dados)
    const comMesmoCodigo = await ativoRepositorio.buscarCodigo(normalizados.codigo, usuarioId)
    if (comMesmoCodigo && comMesmoCodigo.id !== atual.id) {
      throw erros.conflito('Já existe um ativo com este código.', 'codigo')
    }
    const ativo = await ativoRepositorio.atualizar(atual.id, normalizados, usuarioId)
    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.ATIVO_EDITADO,
      alvo: { entidade: 'ativo', id: ativo.id },
      ip,
    })
    return ativo.paraResposta()
  },

  async reiniciar(id, usuarioId, ip) {
    const ativo = await buscarOuFalhar(id, usuarioId)
    const alvo = { entidade: 'ativo', id: ativo.id }

    await AuditoriaService.registrar({ usuarioId, acao: ACOES_AUDITADAS.REINICIO_SOLICITADO, alvo, ip })

    const motivo = ativo.motivoParaNaoReiniciar()
    if (motivo) {
      await AuditoriaService.registrar({
        usuarioId,
        acao: ACOES_AUDITADAS.REINICIO_RECUSADO,
        alvo,
        ip,
        detalhes: { motivo },
      })
      throw erros.conflito(motivo)
    }

    const recebido = controleSimulacao.reiniciarAtivo(ativo.id)
    const resultado = recebido ? 'CONCLUIDO' : 'SEM_CONFIRMACAO'
    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.REINICIO_CONCLUIDO,
      alvo,
      ip,
      detalhes: { resultado, modo: 'SIMULACAO' },
    })

    return {
      resultado,
      mensagem: recebido
        ? `Reinício de ${ativo.codigo} executado (simulação). O ativo volta a enviar dados em instantes.`
        : `Solicitação de reinício de ${ativo.codigo} registrada, mas o simulador não está ativo nesta API para confirmar a execução.`,
    }
  },
}
