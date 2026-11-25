import Icone from './Icone.jsx'

const CLASSE_TOM = { verde: 'green', vermelho: 'red', amarelo: 'yellow' }
const CLASSE_DIRECAO = { positiva: 'positive', negativa: 'negative', atencao: 'warning' }

function CartaoIndicador({ indicador }) {
  const { rotulo, valor, tendencia, direcao, icone, tom } = indicador

  return (
    <article className="metric-card">
      <div className="metric-card__topline">
        <h2>{rotulo}</h2>
        <span className={`metric-icon metric-icon--${CLASSE_TOM[tom]}`}>
          <Icone nome={icone} tamanho={18} />
        </span>
      </div>
      <p className="metric-card__value">{valor}</p>
      <p className={`metric-card__trend metric-card__trend--${CLASSE_DIRECAO[direcao]}`}>
        <Icone nome={direcao === 'atencao' ? 'alerta' : direcao === 'negativa' ? 'setaBaixo' : 'setaCima'} tamanho={13} />
        <span>{tendencia}</span>
      </p>
    </article>
  )
}

export default CartaoIndicador
