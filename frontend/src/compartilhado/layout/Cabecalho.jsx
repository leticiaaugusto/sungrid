import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icone from '../componentes/Icone.jsx'
import { encerrarSessao } from '../sessao/sessao.js'
import { mensagemDeErro } from '../utilitarios/formatacao.js'
import { layoutServico } from './layoutServico.js'

const ROTULOS_STATUS_ATIVO = {
  OPERANDO: 'Operacional',
  ALERTA: 'Atenção',
  OFFLINE: 'Offline',
  MANUTENCAO: 'Em manutenção',
}

const ATRASO_BUSCA_MS = 250

function Cabecalho({ titulo, usuario }) {
  const [termo, setTermo] = useState('')
  const [ativos, setAtivos] = useState([])
  const [erroBusca, setErroBusca] = useState('')
  const [pesquisando, setPesquisando] = useState(false)
  const navegar = useNavigate()
  const termoLimpo = termo.trim()

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    if (!termoLimpo) return undefined

    let ativo = true
    const temporizador = window.setTimeout(() => {
      layoutServico
        .buscarAtivos(termoLimpo)
        .then((resultado) => {
          if (!ativo) return
          setAtivos(resultado)
          setErroBusca('')
          setPesquisando(false)
        })
        .catch((falha) => {
          if (!ativo) return
          setAtivos([])
          setErroBusca(mensagemDeErro(falha, 'Não foi possível pesquisar os ativos.'))
          setPesquisando(false)
        })
    }, ATRASO_BUSCA_MS)

    return () => {
      ativo = false
      window.clearTimeout(temporizador)
    }
  }, [termoLimpo])

  function sair(evento) {
    evento.preventDefault()
    encerrarSessao()
    navegar('/login', { replace: true })
  }

  return (
    <header className="dashboard-header">
      <h1>{titulo}</h1>
      <div className="dashboard-header__tools">
        <div className="asset-search">
          <Icone nome="busca" tamanho={16} />
          <input
            type="search"
            value={termo}
            onChange={(evento) => {
              setTermo(evento.target.value)
              setAtivos([])
              setErroBusca('')
              setPesquisando(Boolean(evento.target.value.trim()))
            }}
            placeholder="Pesquisar ativos..."
            aria-label="Pesquisar ativos"
            aria-controls="resultados-busca-ativos"
            aria-expanded={Boolean(termoLimpo)}
          />
          {termoLimpo && (
            <ul className="asset-search-results" id="resultados-busca-ativos">
              {erroBusca ? (
                <li role="alert">{erroBusca}</li>
              ) : ativos.length > 0 ? (
                ativos.map((ativo) => (
                  <li key={ativo.id}>
                    <Link
                      className="asset-search-result"
                      to={`/ativos/${ativo.id}`}
                      onClick={() => {
                        setTermo('')
                        setAtivos([])
                      }}
                    >
                      <span>
                        {ativo.codigo} · {ativo.nome}
                      </span>
                      <span
                        className={`asset-search-status asset-search-status--${ativo.status === 'OPERANDO' ? 'ok' : 'warning'}`}
                      >
                        {ROTULOS_STATUS_ATIVO[ativo.status] ?? ativo.status}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li role="status">{pesquisando ? 'Pesquisando ativos...' : 'Nenhum ativo encontrado.'}</li>
              )}
            </ul>
          )}
        </div>
        <div className="dashboard-user">
          {usuario?.fotoUrl ? (
            <img className="dashboard-user__avatar" src={usuario.fotoUrl} alt="" />
          ) : (
            <span className="dashboard-user__avatar" aria-hidden="true">
              {usuario?.iniciais || 'SG'}
            </span>
          )}
          <span className="dashboard-user__details">
            <Link to="/configuracoes"><strong>{usuario?.nome ?? 'Usuário SunGrid'}</strong></Link>
            <span>{usuario?.cargo ?? 'Operador de Rede'}</span>
          </span>
        </div>
        <Link className="dashboard-logout" to="/login" onClick={sair}>
          Sair
        </Link>
      </div>
    </header>
  )
}

export default Cabecalho
