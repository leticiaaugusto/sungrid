import { useEffect, useState } from 'react'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import CartaoIndicador from '../../compartilhado/componentes/CartaoIndicador.jsx'
import {
  formatarKwh,
  formatarReais,
  formatarVariacao,
  mensagemDeErro,
  nomeDoMes,
} from '../../compartilhado/utilitarios/formatacao.js'
import GraficoConsumoMensal from './GraficoConsumoMensal.jsx'
import { consumoMensalServico } from './consumoMensalServico.js'

const avaliarConsumo = (variacao) =>
  variacao === null
    ? { direcao: 'atencao', tom: 'amarelo' }
    : variacao <= 0
      ? { direcao: 'positiva', tom: 'verde' }
      : { direcao: 'negativa', tom: 'vermelho' }
// Esta função organiza os dados antes de enviá-los ou exibí-los.

function montarIndicadores(mes) {
  const { comparacao } = mes
  const nomeAnterior = nomeDoMes(comparacao.mesAnterior, { comAno: false })
  return [
    {
      id: 'total-acumulado',
      rotulo: 'Total Acumulado',
      valor: formatarKwh(mes.totalKwh),
      tendencia: `${mes.diasComLeitura} dia(s) com leituras no mês`,
      icone: 'sol',
      direcao: 'positiva',
      tom: 'verde',
    },
    {
      id: 'media-diaria',
      rotulo: 'Média Diária',
      valor: formatarKwh(mes.mediaDiariaKwh),
      tendencia:
        mes.variacaoMediaVsMetaPct === null
          ? 'Sem meta diária configurada'
          : `${formatarVariacao(mes.variacaoMediaVsMetaPct)} em relação à meta diária`,
      icone: 'atividade',
      ...avaliarConsumo(mes.variacaoMediaVsMetaPct),
    },
    {
      id: 'comparacao-anterior',
      rotulo: 'Comparação Anterior',
      valor: formatarVariacao(comparacao.variacaoPct),
      tendencia: `Média diária vs mesmo período de ${nomeAnterior}`,
      icone: 'bateria',
      ...avaliarConsumo(comparacao.variacaoPct),
    },
    {
      id: 'projecao',
      rotulo: 'Projeção do Mês',
      valor: formatarKwh(mes.projecaoKwh),
      tendencia:
        mes.projecaoDentroDoLimite === null
          ? 'Sem limite contratual configurado'
          : mes.projecaoDentroDoLimite
            ? 'Estimado dentro do limite contratual'
            : 'Estimado acima do limite contratual',
      icone: 'atividade',
      direcao: mes.projecaoDentroDoLimite === false ? 'negativa' : 'positiva',
      tom: mes.projecaoDentroDoLimite === false ? 'vermelho' : 'verde',
    },
  ]
}

function BarraComparacao({ rotulo, valorKwh, maximo, classe }) {
  const percentual = maximo ? Math.round((valorKwh / maximo) * 90) : 0
  return (
    <div className="comparison-period">
      <div className="comparison-period__heading">
        <span>{rotulo}</span>
        <strong>{formatarKwh(valorKwh)}</strong>
      </div>
      <div
        className="comparison-bar"
        role="meter"
        aria-label={`Consumo ${rotulo}`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percentual}
      >
        <span className={`comparison-bar__fill comparison-bar__fill--${classe}`} style={{ width: `${percentual}%` }} />
      </div>
    </div>
  )
}
// Esta tela monta a página ConsumoMensal.

function PaginaConsumoMensal() {
  const [mes, setMes] = useState(null)
  const [economia, setEconomia] = useState(null)
  const [erro, setErro] = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState(null)

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      Promise.all([consumoMensalServico.doMes(), consumoMensalServico.economia()])
        .then(([dadosMes, dadosEconomia]) => {
          if (!ativo) return
          setMes(dadosMes)
          setEconomia(dadosEconomia)
          setAtualizadoEm(new Date())
          setErro('')
        })
        .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar o consumo mensal.')))
    atualizar()
    const intervalo = window.setInterval(atualizar, 60_000)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [])

  if (!mes || !economia) {
    return erro ? (
      <Alerta variante="erro">{erro}</Alerta>
    ) : (
      <div className="dashboard-loading" role="status">
        Carregando consumo mensal...
      </div>
    )
  }

  const nomeAtual = nomeDoMes(mes.mes, { comAno: false })
  const nomeAnterior = nomeDoMes(mes.comparacao.mesAnterior, { comAno: false })
  const atualKwh = mes.totalKwh
  const anteriorKwh = mes.comparacao.totalMesAnteriorEquivalenteKwh
  const maior = Math.max(atualKwh ?? 0, anteriorKwh ?? 0)

  return (
    <>
      <p className="demo-data-note">
        Dados simulados (loja de demonstração)
        {atualizadoEm && ` · Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
      </p>
      <section className="metrics-grid monthly-metrics-grid" aria-label="Indicadores de consumo mensal">
        {montarIndicadores(mes).map((indicador) => (
          <CartaoIndicador key={indicador.id} indicador={indicador} />
        ))}
      </section>
      <GraficoConsumoMensal
        dados={{
          dias: mes.dias.map((dia) => String(dia.dia)),
          consumoKwh: mes.dias.map((dia) => dia.consumoKwh),
          periodo: nomeDoMes(mes.mes),
        }}
      />
      <div className="monthly-insights-grid">
        <section className="monthly-insight-card" aria-labelledby="titulo-comparacao-mensal">
          <h2 id="titulo-comparacao-mensal">
            {nomeAtual} vs {nomeAnterior} (Consumo Comparativo)
          </h2>
          <p>{mes.insights.comparacao}</p>
          <BarraComparacao
            rotulo={`${nomeAtual} (Mês Atual)`}
            valorKwh={atualKwh}
            maximo={maior}
            classe="current"
          />
          <BarraComparacao
            rotulo={`${nomeAnterior} (mesmo período)`}
            valorKwh={anteriorKwh}
            maximo={maior}
            classe="previous"
          />
        </section>
        <section className="monthly-insight-card" aria-labelledby="titulo-economia-mensal">
          <h2 id="titulo-economia-mensal">Economia Estimada por Autogeração</h2>
          <p>{mes.insights.autogeracao}</p>
          <div className="savings-values">
            <div className="savings-value">
              <span>Redução Total</span>
              <strong className="savings-value__reduction">
                {economia.energiaGeradaKwh === null ? '—' : `−${formatarKwh(economia.energiaGeradaKwh)}`}
              </strong>
            </div>
            <div className="savings-value">
              <span>Financeiro Estimado</span>
              <strong className="savings-value__financial">{formatarReais(economia.economiaReais)}</strong>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default PaginaConsumoMensal
