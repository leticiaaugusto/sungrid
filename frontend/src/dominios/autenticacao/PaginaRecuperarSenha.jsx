import { useState } from 'react'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import CampoFormulario from '../../compartilhado/componentes/CampoFormulario.jsx'
import { GrupoCampos } from '../../compartilhado/componentes/GrupoCampos.jsx'
import { mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { obterErrosDoFormulario } from '../../compartilhado/utilitarios/validacaoFormulario.js'
import LayoutAutenticacao from './LayoutAutenticacao.jsx'
import { autenticacaoServico } from './autenticacaoServico.js'

/**
 * Tela "Esqueci minha senha" (RF04 / RF05).
 * A confirmação é a mesma exista ou não a conta (RN06).
 */
function PaginaRecuperarSenha() {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [errosCampos, setErrosCampos] = useState({})

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

    setErrosCampos({})
    setEnviando(true)

    try {
      const resposta = await autenticacaoServico.solicitarRecuperacao(new FormData(formulario).get('email'))
      setMensagem(resposta.mensagem)
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível enviar a solicitação. Tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LayoutAutenticacao
      titulo="SunGrid"
      subtitulo="Gestão inteligente de energia solar"
      className="recovery-card"
      linkVoltar="/login"
    >
      <form className="auth-form" onSubmit={enviar} noValidate>
        <GrupoCampos>
          <CampoFormulario
            id="email"
            rotulo="Digite seu endereço de e-mail"
            tipo="email"
            placeholder="seu@email.com"
            autoComplete="email"
            erro={errosCampos.email}
            onChange={() => setErrosCampos((atuais) => ({ ...atuais, email: '' }))}
          />
        </GrupoCampos>
        {erro && <Alerta variante="erro">{erro}</Alerta>}
        {mensagem && <Alerta>{mensagem}</Alerta>}
        <button className="submit-button" type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </LayoutAutenticacao>
  )
}

export default PaginaRecuperarSenha
