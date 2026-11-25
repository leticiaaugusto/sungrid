import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import CampoFormulario from '../../compartilhado/componentes/CampoFormulario.jsx'
import { GrupoCampos } from '../../compartilhado/componentes/GrupoCampos.jsx'
import { mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { obterErrosDoFormulario } from '../../compartilhado/utilitarios/validacaoFormulario.js'
import LayoutAutenticacao from './LayoutAutenticacao.jsx'
import { autenticacaoServico } from './autenticacaoServico.js'
// Esta tela monta a página Cadastro.

function PaginaCadastro() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [errosCampos, setErrosCampos] = useState({})
// Esta função envia ou recebe dados da API.

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setMensagem('')

    const formulario = evento.currentTarget
    const novosErros = obterErrosDoFormulario(formulario)
    if (Object.keys(novosErros).length > 0) {
      setErrosCampos(novosErros)
      return
    }

    const dados = new FormData(formulario)
    const senha = dados.get('senha')
    const confirmacaoSenha = dados.get('confirmacaoSenha')

    if (senha !== confirmacaoSenha) {
      setErrosCampos({ confirmacaoSenha: 'As senhas não coincidem.' })
      return
    }

    setErrosCampos({})
    setEnviando(true)

    try {
      const resposta = await autenticacaoServico.cadastrar({
        nome: dados.get('nome'),
        email: dados.get('email'),
        senha,
        confirmacaoSenha,
        perfil: dados.get('perfil'),
      })
      setMensagem(resposta.mensagem)
      formulario.reset()
    } catch (falha) {

      if (falha.campo) setErrosCampos({ [falha.campo]: falha.message })
      else setErro(mensagemDeErro(falha, 'Não foi possível criar sua conta. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  const limparErro = (campo) => () => setErrosCampos((atuais) => ({ ...atuais, [campo]: '' }))

  return (
    <LayoutAutenticacao
      titulo="Criar sua conta"
      subtitulo="Junte-se ao monitoramento sustentável"
      className="register-card"
      rodape={
        <>
          <span>Já possui uma conta?</span> <Link to="/login">Entrar aqui</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={enviar} noValidate>
        <GrupoCampos>
          <CampoFormulario
            id="nome"
            rotulo="Nome Completo"
            placeholder="Ex: Carlos Silva"
            autoComplete="name"
            erro={errosCampos.nome}
            onChange={limparErro('nome')}
          />
          <CampoFormulario
            id="email"
            rotulo="E-mail Corporativo"
            tipo="email"
            placeholder="seu@email.com"
            autoComplete="email"
            erro={errosCampos.email}
            onChange={limparErro('email')}
          />
          <div className="auth-field">
            <label htmlFor="perfil">Perfil</label>
            <select id="perfil" name="perfil" required defaultValue="" onChange={limparErro('perfil')}>
              <option value="" disabled>Selecione um perfil</option>
              <option value="OPERADOR">Operador de Rede</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>
          <CampoFormulario
            id="senha"
            rotulo="Definir Senha"
            tipo="password"
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            erro={errosCampos.senha}
            onChange={limparErro('senha')}
          />
          <CampoFormulario
            id="confirmacaoSenha"
            rotulo="Confirmar Senha"
            tipo="password"
            placeholder="Repita sua senha"
            autoComplete="new-password"
            minLength={8}
            erro={errosCampos.confirmacaoSenha}
            onChange={limparErro('confirmacaoSenha')}
          />
        </GrupoCampos>
        {erro && <Alerta variante="erro">{erro}</Alerta>}
        {mensagem && <Alerta>{mensagem}</Alerta>}
        <button className="submit-button" type="submit" disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </LayoutAutenticacao>
  )
}

export default PaginaCadastro
