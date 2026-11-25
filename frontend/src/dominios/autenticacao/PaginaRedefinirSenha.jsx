import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import CampoFormulario from '../../compartilhado/componentes/CampoFormulario.jsx'
import { GrupoCampos } from '../../compartilhado/componentes/GrupoCampos.jsx'
import { mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { obterErrosDoFormulario } from '../../compartilhado/utilitarios/validacaoFormulario.js'
import LayoutAutenticacao from './LayoutAutenticacao.jsx'
import { autenticacaoServico } from './autenticacaoServico.js'
// Esta tela monta a página RedefinirSenha.

function PaginaRedefinirSenha() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [errosCampos, setErrosCampos] = useState({})
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
      const resposta = await autenticacaoServico.redefinirSenha({ token, senha, confirmacaoSenha })
      setMensagem(resposta.mensagem)
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível redefinir a senha.'))
    } finally {
      setEnviando(false)
    }
  }

  const limparErro = (campo) => () => setErrosCampos((atuais) => ({ ...atuais, [campo]: '' }))

  return (
    <LayoutAutenticacao titulo="Nova senha" subtitulo="Defina uma nova senha para o SunGrid" className="recovery-card" linkVoltar="/login">
      {!token ? (
        <Alerta variante="erro">Link inválido. Solicite a recuperação de senha novamente.</Alerta>
      ) : mensagem ? (
        <>
          <Alerta>{mensagem}</Alerta>
          <div className="form-link-row">
            <Link to="/login">Ir para o login</Link>
          </div>
        </>
      ) : (
        <form className="auth-form" onSubmit={enviar} noValidate>
          <GrupoCampos>
            <CampoFormulario
              id="senha"
              rotulo="Nova Senha"
              tipo="password"
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              erro={errosCampos.senha}
              onChange={limparErro('senha')}
            />
            <CampoFormulario
              id="confirmacaoSenha"
              rotulo="Confirmar Nova Senha"
              tipo="password"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              minLength={8}
              erro={errosCampos.confirmacaoSenha}
              onChange={limparErro('confirmacaoSenha')}
            />
          </GrupoCampos>
          {erro && <Alerta variante="erro">{erro}</Alerta>}
          <button className="submit-button" type="submit" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      )}
    </LayoutAutenticacao>
  )
}

export default PaginaRedefinirSenha
