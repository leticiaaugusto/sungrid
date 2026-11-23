import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import { obterUsuario } from '../../compartilhado/sessao/sessao.js'
import { formatarDataHora, mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { usuariosServico } from './usuariosServico.js'

const NOMES_PAPEIS = { OPERADOR: 'Operador de Rede', ADMINISTRADOR: 'Administrador' }

/** Tela administrativa de usuários, perfis e pedidos pendentes. */
function PaginaUsuarios() {
  const usuarioAtual = obterUsuario()
  const [usuarios, setUsuarios] = useState([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function atualizar() {
    setErro('')
    try {
      setUsuarios(await usuariosServico.listar())
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível carregar os usuários.'))
    }
  }

  useEffect(() => {
    let ativo = true
    if (usuarioAtual?.papel === 'ADMINISTRADOR') {
      usuariosServico
        .listar()
        .then((lista) => ativo && setUsuarios(lista))
        .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar os usuários.')))
    }
    return () => {
      ativo = false
    }
  }, [usuarioAtual?.papel])

  if (usuarioAtual?.papel !== 'ADMINISTRADOR') return <Navigate to="/dashboard" replace />

  async function alterarPapel(usuario, papel) {
    setErro('')
    setMensagem('')
    try {
      await usuariosServico.alterarPapel(usuario.id, papel)
      setMensagem(papel === 'RECUSAR' ? 'Pedido recusado.' : 'Perfil atualizado.')
      await atualizar()
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível alterar o perfil.'))
    }
  }

  return (
    <section className="users-page" aria-label="Usuários">
      {erro && <Alerta variante="erro">{erro}</Alerta>}
      {mensagem && <Alerta>{mensagem}</Alerta>}
      <div className="alerts-table-card">
        <div className="alerts-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Perfil</th>
                <th>Pedido pendente</th>
                <th>Data de criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td><strong>{usuario.nome}</strong></td>
                  <td>{usuario.email}</td>
                  <td>{usuario.cargo || '—'}</td>
                  <td>{NOMES_PAPEIS[usuario.papel] ?? usuario.papel}</td>
                  <td>{usuario.papelSolicitado ? NOMES_PAPEIS[usuario.papelSolicitado] : '—'}</td>
                  <td>{usuario.criadoEm ? formatarDataHora(usuario.criadoEm) : '—'}</td>
                  <td>
                    <select
                      aria-label={`Alterar perfil de ${usuario.nome}`}
                      value={usuario.papel}
                      onChange={(evento) => alterarPapel(usuario, evento.target.value)}
                    >
                      <option value="OPERADOR">Operador de Rede</option>
                      <option value="ADMINISTRADOR">Administrador</option>
                    </select>
                    {usuario.papelSolicitado && (
                      <>
                        <button
                          className="users-reject-button"
                          type="button"
                          onClick={() => alterarPapel(usuario, usuario.papelSolicitado)}
                        >
                          Aprovar
                        </button>
                        <button
                          className="users-reject-button"
                          type="button"
                          onClick={() => alterarPapel(usuario, 'RECUSAR')}
                        >
                          Recusar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default PaginaUsuarios
