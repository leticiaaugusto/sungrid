import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import CampoFormulario from '../../compartilhado/componentes/CampoFormulario.jsx'
import { GrupoCampos } from '../../compartilhado/componentes/GrupoCampos.jsx'
import { salvarSessao } from '../../compartilhado/sessao/sessao.js'
import { mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { obterErrosDoFormulario } from '../../compartilhado/utilitarios/validacaoFormulario.js'
import LayoutAutenticacao from './LayoutAutenticacao.jsx'
import { autenticacaoServico } from './autenticacaoServico.js'
// Esta tela monta a página Login.

function PaginaLogin() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosCampos, setErrosCampos] = useState({})
  const navegar = useNavigate()
  const localizacao = useLocation()
  const [parametros] = useSearchParams()
  const sessaoExpirada = parametros.get('sessao') === 'expirada'
// Esta função envia ou recebe dados da API.

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')

    const formulario = evento.currentTarget
    const novosErros = obterErrosDoFormulario(formulario)
    if (Object.keys(novosErros).length > 0) {
      setErrosCampos(novosErros)
      return
    }

    setErrosCampos({})
    setEnviando(true)
    const dados = new FormData(formulario)

    try {
      const sessao = await autenticacaoServico.entrar({ email: dados.get('email'), senha: dados.get('senha') })
      salvarSessao(sessao)

      navegar(localizacao.state?.voltarPara ?? '/dashboard', { replace: true })
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível entrar. Tente novamente.'))
      setEnviando(false)
    }
  }

  const limparErro = (campo) => () => setErrosCampos((atuais) => ({ ...atuais, [campo]: '' }))

  return (
    <LayoutAutenticacao
      titulo="SunGrid"
      subtitulo="Gestão inteligente de energia solar"
      className="login-card"
      rodape={
        <>
          <span>Novo no SunGrid?</span> <Link to="/cadastro">Cadastrar-se</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={enviar} noValidate>
        <GrupoCampos>
          <CampoFormulario
            id="email"
            rotulo="Endereço de E-mail"
            tipo="email"
            placeholder="seu@email.com"
            autoComplete="email"
            erro={errosCampos.email}
            onChange={limparErro('email')}
          />
          <CampoFormulario
            id="senha"
            rotulo="Senha"
            tipo="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            erro={errosCampos.senha}
            onChange={limparErro('senha')}
          />
        </GrupoCampos>
        {sessaoExpirada && !erro && <Alerta variante="erro">Sua sessão expirou. Entre novamente.</Alerta>}
        {erro && <Alerta variante="erro">{erro}</Alerta>}
        <button className="submit-button" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
        <div className="form-link-row">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </div>
      </form>
    </LayoutAutenticacao>
  )
}

export default PaginaLogin
