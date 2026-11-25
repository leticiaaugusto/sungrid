import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import { obterUsuario } from '../../compartilhado/sessao/sessao.js'
import { formatarDataHora, mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import { usuariosServico } from './usuariosServico.js'

const NOMES_PAPEIS = { OPERADOR: 'Operador de Rede', ADMINISTRADOR: 'Administrador' }
// Esta tela monta a página Usuarios.

function PaginaUsuarios() {
  const usuarioAtual = obterUsuario()
  const [usuarios, setUsuarios] = useState([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [operadorSelecionado, setOperadorSelecionado] = useState(null)
  const [ativosAtribuiveis, setAtivosAtribuiveis] = useState([])
  const [idsAtivosSelecionados, setIdsAtivosSelecionados] = useState([])
  const [carregandoAtribuicao, setCarregandoAtribuicao] = useState(false)
  const [falhaCarregamentoAtivos, setFalhaCarregamentoAtivos] = useState(false)
  const [salvandoAtribuicao, setSalvandoAtribuicao] = useState(false)
// Esta função grava ou atualiza os dados.

  async function atualizar() {
    setErro('')
    try {
      setUsuarios(await usuariosServico.listar())
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível carregar os usuários.'))
    }
  }

  // Este efeito atualiza a tela quando necessário.

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

  async function abrirAtribuicao(usuario) {
    setErro('')
    setMensagem('')
    setOperadorSelecionado(usuario)
    setAtivosAtribuiveis([])
    setIdsAtivosSelecionados([])
    setFalhaCarregamentoAtivos(false)
    setCarregandoAtribuicao(true)
    try {
      const ativos = await usuariosServico.listarAtivosDoOperador(usuario.id)
      setAtivosAtribuiveis(ativos)
      setIdsAtivosSelecionados(ativos.filter((ativo) => ativo.atribuido).map((ativo) => ativo.id))
    } catch (falha) {
      setFalhaCarregamentoAtivos(true)
      setErro(mensagemDeErro(falha, 'Não foi possível carregar os ativos disponíveis.'))
    } finally {
      setCarregandoAtribuicao(false)
    }
  }

  function alternarAtivo(ativoId, selecionado) {
    setIdsAtivosSelecionados((atuais) =>
      selecionado ? [...atuais, ativoId] : atuais.filter((id) => id !== ativoId),
    )
  }

  async function salvarAtribuicao() {
    if (!operadorSelecionado) return
    setErro('')
    setMensagem('')
    setSalvandoAtribuicao(true)
    try {
      await usuariosServico.atribuirAtivosAoOperador(operadorSelecionado.id, idsAtivosSelecionados)
      setMensagem(`Ativos atualizados para ${operadorSelecionado.nome}.`)
      setOperadorSelecionado(null)
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível salvar os ativos do operador.'))
    } finally {
      setSalvandoAtribuicao(false)
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
                    {usuario.papel === 'OPERADOR' && (
                      <button
                        className="users-assignment-button"
                        type="button"
                        onClick={() => abrirAtribuicao(usuario)}
                      >
                        Atribuir ativos
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {operadorSelecionado && (
        <div className="asset-modal" role="dialog" aria-modal="true" aria-label="Atribuir ativos ao operador">
          <div className="asset-modal__card users-assignment-modal">
            <h2>Ativos de {operadorSelecionado.nome}</h2>
            <p>Selecione quais ativos este operador poderá acompanhar.</p>
            {carregandoAtribuicao ? (
              <p role="status">Carregando ativos...</p>
            ) : ativosAtribuiveis.length > 0 ? (
              <div className="users-assets-list">
                {ativosAtribuiveis.map((ativo) => (
                  <label key={ativo.id}>
                    <input
                      type="checkbox"
                      checked={idsAtivosSelecionados.includes(ativo.id)}
                      onChange={(evento) => alternarAtivo(ativo.id, evento.target.checked)}
                    />
                    <span><strong>{ativo.codigo}</strong> · {ativo.nome} ({ativo.tipo})</span>
                  </label>
                ))}
              </div>
            ) : (
              <p>Nenhum ativo pertence a esta conta administradora.</p>
            )}
            <div className="asset-modal__actions">
              <button
                className="asset-action-button asset-action-button--secondary"
                type="button"
                onClick={() => setOperadorSelecionado(null)}
              >
                Cancelar
              </button>
              <button
                className="asset-action-button asset-action-button--primary"
                type="button"
                disabled={carregandoAtribuicao || falhaCarregamentoAtivos || salvandoAtribuicao}
                onClick={salvarAtribuicao}
              >
                {salvandoAtribuicao ? 'Salvando...' : 'Salvar atribuições'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PaginaUsuarios
