import { useEffect, useState } from 'react'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import {
  formatarHorario,
  formatarKw,
  formatarKwh,
  formatarNumero,
  mensagemDeErro,
} from '../../compartilhado/utilitarios/formatacao.js'
import GraficoConsumoDiario from './GraficoConsumoDiario.jsx'
import { consumoDiarioServico } from './consumoDiarioServico.js'
// Esta função organiza os dados antes de enviá-los ou exibí-los.

function montarIndicadores(dia) {
  const janela = dia.janelaMaiorGeracao
  return [
    {
      id: 'pico-consumo',
      rotulo: 'Pico Consumo',
      valor: formatarKw(dia.picoConsumo?.potenciaKw),
      legenda: dia.picoConsumo ? `Registrado às ${dia.picoConsumo.horario}` : 'Sem leituras no dia',
    },
    {
      id: 'media',
      rotulo: 'Potência Média',
      valor: formatarKw(dia.mediaPotenciaKw),
      legenda: 'Potência média consumida no período medido',
      tom: 'positivo',
    },
    {
      id: 'geracao',
      rotulo: 'Geração do Dia',
      valor: formatarKwh(dia.totalGeracaoKwh),
      legenda: dia.totalConsumoKwh
        ? `${formatarNumero((dia.totalGeracaoKwh / dia.totalConsumoKwh) * 100, 1)}% do consumo coberto pela geração solar`
        : 'Sem consumo registrado para calcular a cobertura',
      tom: 'destaque',
    },
    {
      id: 'total',
      rotulo: 'Total Acumulado',
      valor: formatarKwh(dia.totalConsumoKwh),
      legenda: dia.diaCompleto ? 'Ciclo de 24h fechado' : 'Dia em andamento',
    },
    {
      id: 'horario-pico',
      rotulo: 'Horário de Pico',
      valor: janela ? `${janela.inicio}h - ${janela.fim}h` : '—',
      legenda: 'Janela de maior geração solar',
      tom: 'destaque',
    },
  ]
}

const CLASSE_TOM = { positivo: 'positive', destaque: 'accent' }
// Esta tela monta a página ConsumoDiario.

function PaginaConsumoDiario() {
  const [dia, setDia] = useState(null)
  const [erro, setErro] = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState(null)

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      consumoDiarioServico
        .porHora()
        .then((dados) => {
          if (!ativo) return
          setDia(dados)
          setAtualizadoEm(new Date())
          setErro('')
        })
        .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar o consumo diário.')))
    atualizar()
    const intervalo = window.setInterval(atualizar, 15_000)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [])

  if (!dia) {
    return erro ? (
      <Alerta variante="erro">{erro}</Alerta>
    ) : (
      <div className="dashboard-loading" role="status">
        Carregando consumo diário...
      </div>
    )
  }

  return (
    <>
      <p className="demo-data-note">
        Dados simulados (loja de demonstração)
        {atualizadoEm && ` · Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
      </p>
      <GraficoConsumoDiario
        dados={{
          rotulos: dia.horas.map((hora) => `${String(hora.hora).padStart(2, '0')}h`),
          geracaoKw: dia.horas.map((hora) => hora.geracaoKw),
          consumoKw: dia.horas.map((hora) => hora.consumoKw),
          picoSolar: formatarHorario(dia.picoSolar?.horario),
        }}
      />
      <section className="daily-metrics-grid" aria-label="Indicadores de consumo diário">
        {montarIndicadores(dia).map((indicador) => (
          <article className="daily-metric-card" key={indicador.id}>
            <h2>{indicador.rotulo}</h2>
            <p
              className={`daily-metric-card__value${indicador.tom ? ` daily-metric-card__value--${CLASSE_TOM[indicador.tom]}` : ''}`}
            >
              {indicador.valor}
            </p>
            <p
              className={`daily-metric-card__caption${indicador.tom === 'positivo' ? ' daily-metric-card__caption--positive' : ''}`}
            >
              {indicador.legenda}
            </p>
          </article>
        ))}
      </section>
    </>
  )
}

export default PaginaConsumoDiario
