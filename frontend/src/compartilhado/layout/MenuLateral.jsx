import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Icone from '../componentes/Icone.jsx'
import { formatarNumero, formatarTempoDecorrido } from '../utilitarios/formatacao.js'

// Tempos da animação do card de alerta: ao passar o mouse ele é marcado
// como visto, some e volta a aparecer depois de 5 minutos.
const ATRASO_CONFIRMACAO_MS = 1200
const DURACAO_SUMIR_MS = 800
const REEXIBIR_DEPOIS_MS = 5 * 60 * 1000

const ITENS_MENU = [
  { rotulo: 'Dashboard', caminho: '/dashboard', icone: 'painel' },
  { rotulo: 'Consumo Diário', caminho: '/consumo-diario', icone: 'calendario' },
  { rotulo: 'Consumo Mensal', caminho: '/consumo-mensal', icone: 'calendario' },
  { rotulo: 'Alertas', caminho: '/alertas', icone: 'alerta' },
  { rotulo: 'Acompanhamento de Ativo', caminho: '/ativos', icone: 'atividade' },
]

/**
 * Menu lateral (RF08) com o card de alertas ativos e a pegada de carbono (RF12).
 *
 * @param {{ alertasAtivos: Array|null, carbono: { co2EvitadoKg: number }|null }} props
 */
function MenuLateral({ alertasAtivos, carbono, usuario }) {
  // A API devolve os alertas do mais recente para o mais antigo.
  const ultimoAlerta = alertasAtivos?.[0]
  const idAlerta = ultimoAlerta?.id
  const [estadoCard, setEstadoCard] = useState({ idAlerta: null, fase: 'visivel' })
  const temporizadorConfirmacao = useRef(null)
  const temporizadorSumir = useRef(null)
  const temporizadorReexibir = useRef(null)
  const fase = estadoCard.idAlerta === idAlerta ? estadoCard.fase : 'visivel'

  useEffect(
    () => () => {
      window.clearTimeout(temporizadorConfirmacao.current)
      window.clearTimeout(temporizadorSumir.current)
      window.clearTimeout(temporizadorReexibir.current)
    },
    [idAlerta],
  )

  function marcarComoVisto(atraso = ATRASO_CONFIRMACAO_MS) {
    if (!ultimoAlerta || fase !== 'visivel') return

    window.clearTimeout(temporizadorConfirmacao.current)
    temporizadorConfirmacao.current = window.setTimeout(() => {
      setEstadoCard({ idAlerta, fase: 'sumindo' })
      temporizadorSumir.current = window.setTimeout(() => {
        setEstadoCard({ idAlerta, fase: 'oculto' })
        temporizadorReexibir.current = window.setTimeout(() => {
          setEstadoCard({ idAlerta, fase: 'visivel' })
        }, REEXIBIR_DEPOIS_MS)
      }, DURACAO_SUMIR_MS)
    }, atraso)
  }

  function cancelarConfirmacao() {
    if (fase === 'visivel') window.clearTimeout(temporizadorConfirmacao.current)
  }

  // As classes CSS do protótipo usam os nomes em inglês das fases.
  const classeFase = { visivel: 'visible', sumindo: 'fading', oculto: 'hidden' }[fase]
  const quantidade = alertasAtivos ? alertasAtivos.length : '—'
  const itensVisiveis = [
    ...ITENS_MENU,
    { rotulo: 'Minha Conta', caminho: '/configuracoes', icone: 'usuario' },
    ...(usuario?.papel === 'ADMINISTRADOR'
      ? [{ rotulo: 'Usuários', caminho: '/usuarios', icone: 'usuarios' }]
      : []),
  ]

  const cabecalhoCard = (
    <div className="carbon-card__heading">
      <Icone nome="alerta" tamanho={15} />
      <span>Alertas ativos</span>
      <span className="carbon-card__count">{quantidade}</span>
    </div>
  )

  return (
    <aside className="dashboard-sidebar">
      <Link className="brand-lockup" to="/dashboard" aria-label="SunGrid, início">
        <img src="/sungrid-logo.jpg" alt="" />
        <span>SunGrid</span>
      </Link>

      <nav className="sidebar-navigation" aria-label="Navegação principal">
        {itensVisiveis.map((item) => (
          <NavLink
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
            end={item.caminho === '/dashboard'}
            key={item.caminho}
            to={item.caminho}
          >
            {({ isActive }) => (
              <>
                <Icone nome={item.icone} tamanho={17} />
                <span>{item.rotulo}</span>
                {isActive && <span className="sidebar-active-mark" aria-hidden="true" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <section className="carbon-card" aria-label="Alertas recentes">
        <div
          aria-hidden={Boolean(ultimoAlerta) && fase !== 'visivel'}
          className={`carbon-card__alert carbon-card__alert--${classeFase}`}
          onBlurCapture={cancelarConfirmacao}
          onFocusCapture={() => marcarComoVisto()}
          onPointerEnter={() => marcarComoVisto()}
          onPointerLeave={cancelarConfirmacao}
        >
          {cabecalhoCard}
          {ultimoAlerta && (
            <>
              <article className="carbon-card__notification">
                <div className="carbon-card__notification-heading">
                  <strong>{ultimoAlerta.ativo ? `Atenção ao ${ultimoAlerta.ativo.codigo}` : 'Atenção à instalação'}</strong>
                  <button type="button" aria-label="Marcar alerta como visto" onClick={() => marcarComoVisto(0)}>
                    <Icone nome="fechar" tamanho={13} />
                  </button>
                </div>
                <p>{ultimoAlerta.descricao}</p>
                <span className="carbon-card__time">{formatarTempoDecorrido(ultimoAlerta.criadoEm)}</span>
              </article>
              <Link className="carbon-card__link" to="/alertas">
                Ver todos os alertas
              </Link>
            </>
          )}
        </div>
        {alertasAtivos && !ultimoAlerta && <p>Nenhum alerta ativo. A instalação está operando normalmente.</p>}
        {carbono && (
          <p className="carbon-card__impact">
            <Icone nome="folha" tamanho={12} />
            <span>{formatarNumero(carbono.co2EvitadoKg)} kg de CO₂ evitados esta semana</span>
          </p>
        )}
      </section>
    </aside>
  )
}

export default MenuLateral
