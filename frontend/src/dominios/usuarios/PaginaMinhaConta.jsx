import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import { encerrarSessao, obterToken, salvarSessao } from '../../compartilhado/sessao/sessao.js'
import { mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { usuariosServico } from './usuariosServico.js'

/** Tela Minha Conta: perfil, senha, LGPD e pedido de perfil pendente. */
function PaginaMinhaConta() {
  const navegar = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    let ativo = true
    usuariosServico.usuarioAtual()
      .then((dados) => {
        if (!ativo) return
        setUsuario(dados)
        setNome(dados.nome ?? '')
        setCargo(dados.cargo ?? '')
        setFotoUrl(dados.fotoUrl ?? '')
      })
      .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar sua conta.')))
    return () => { ativo = false }
  }, [])

  async function salvarPerfil(evento) {
    evento.preventDefault()
    setErro('')
    setMensagem('')
    try {
      const atualizado = await usuariosServico.atualizarPerfil({ nome, cargo, fotoUrl })
      setUsuario(atualizado)
      salvarSessao({ token: obterToken(), usuario: atualizado })
      setMensagem('Perfil atualizado com sucesso.')
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível atualizar o perfil.'))
    }
  }

  async function alterarSenha(evento) {
    evento.preventDefault()
    setErro('')
    setMensagem('')
    if (novaSenha !== confirmacaoSenha) {
      setErro('A nova senha e a confirmação não coincidem.')
      return
    }
    try {
      const resposta = await usuariosServico.trocarSenha({ senhaAtual, novaSenha, confirmacaoSenha })
      setMensagem(resposta.mensagem)
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmacaoSenha('')
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível alterar a senha.'))
    }
  }

  async function excluirConta() {
    if (!window.confirm('Excluir permanentemente sua conta? Esta ação não pode ser desfeita.')) return
    try {
      await usuariosServico.excluirConta()
      encerrarSessao()
      navegar('/login', { replace: true })
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível excluir sua conta.'))
    }
  }

  return (
    <section className="account-page" aria-label="Minha Conta">
      {erro && <Alerta variante="erro">{erro}</Alerta>}
      {mensagem && <Alerta>{mensagem}</Alerta>}
      {usuario && (
        <div className="account-profile">
          <strong>{usuario.nomePapel}</strong>
          {usuario.papelSolicitado && (
            <p>Pedido pendente: acesso de {usuario.papelSolicitado === 'ADMINISTRADOR' ? 'Administrador' : 'Operador de Rede'} aguardando aprovação.</p>
          )}
        </div>
      )}

      <div className="account-grid">
        <form className="account-card" onSubmit={salvarPerfil}>
          <h2>Dados pessoais</h2>
          <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} required /></label>
          <label>Cargo<input value={cargo} onChange={(e) => setCargo(e.target.value)} /></label>
          <label>URL da foto<input type="url" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} /></label>
          <button className="asset-action-button asset-action-button--primary" type="submit">Salvar perfil</button>
        </form>

        <form className="account-card" onSubmit={alterarSenha}>
          <h2>Trocar senha</h2>
          <label>Senha atual<input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required /></label>
          <label>Nova senha (mín. 8)<input type="password" minLength={8} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required /></label>
          <label>Confirmar nova senha<input type="password" minLength={8} value={confirmacaoSenha} onChange={(e) => setConfirmacaoSenha(e.target.value)} required /></label>
          <button className="asset-action-button asset-action-button--primary" type="submit">Alterar senha</button>
        </form>
      </div>

      <section className="account-card account-card--lgpd" aria-labelledby="titulo-lgpd">
        <h2 id="titulo-lgpd">Dados e privacidade</h2>
        <div className="account-actions">
          <button className="asset-action-button asset-action-button--secondary" type="button" onClick={() => usuariosServico.baixarDados()}>
            Baixar meus dados
          </button>
          <button className="asset-action-button asset-action-button--secondary" type="button" onClick={excluirConta}>
            Excluir minha conta
          </button>
        </div>
      </section>
    </section>
  )
}

export default PaginaMinhaConta
