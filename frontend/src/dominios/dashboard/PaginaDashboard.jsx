import { useEffect, useState } from 'react'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import CartaoIndicador from '../../compartilhado/componentes/CartaoIndicador.jsx'
import {
  diaDaSemana,
  formatarKwh,
  formatarReais,
  formatarVariacao,
  mensagemDeErro,
} from '../../compartilhado/utilitarios/formatacao.js'
import GraficoConsumoSemanal from './GraficoConsumoSemanal.jsx'
import { dashboardServico } from './dashboardServico.js'
// Esta função organiza os dados antes de enviá-los ou exibí-los.

function montarIndicadores(resumo) {
  const { consumoDia, consumoMes, alertas, economia } = resumo
  const tendenciaConsumo = (variacao) =>
    variacao === null ? { direcao: 'atencao', tom: 'amarelo' } : variacao <= 0 ? { direcao: 'positiva', tom: 'verde' } : { direcao: 'negativa', tom: 'vermelho' }

  return [
    {
      id: 'consumo-diario',
      rotulo: 'Consumo Diário',
      valor: formatarKwh(consumoDia.kwh),
      tendencia:
        consumoDia.variacaoPct === null
          ? 'Sem dados da mesma semana passada para comparar'
          : `${formatarVariacao(consumoDia.variacaoPct)} em relação à mesma ${consumoDia.comparadoDia ? diaDaSemana(consumoDia.comparadoDia) : 'data'} passada (até ${consumoDia.comparadoAte})`,
      icone: 'sol',
      ...tendenciaConsumo(consumoDia.variacaoPct),
    },
    {
      id: 'consumo-mensal',
      rotulo: 'Consumo Mensal',
      valor: formatarKwh(consumoMes.kwh),
      tendencia:
        consumoMes.variacaoPct === null
          ? 'Sem dados do mês anterior para comparar'
          : `${formatarVariacao(consumoMes.variacaoPct)} na média diária vs mês anterior`,
      icone: 'bateria',
      ...tendenciaConsumo(consumoMes.variacaoPct),
    },
    {
      id: 'alertas-ativos',
      rotulo: 'Alertas Ativos',
      valor: String(alertas.total),
      tendencia:
        alertas.criticos > 0
          ? `${alertas.criticos} crítico(s) necessitam atenção`
          : 'Nenhum alerta crítico no momento',
      direcao: alertas.total > 0 ? 'atencao' : 'positiva',
      icone: 'alerta',
      tom: alertas.criticos > 0 ? 'amarelo' : 'verde',
    },
    {
      id: 'economia-estimada',
      rotulo: 'Economia Estimada',
      valor: formatarReais(economia.reais),
      tendencia: `${formatarKwh(economia.energiaGeradaKwh)} gerados no mês`,
      direcao: 'positiva',
      icone: 'moeda',
      tom: 'verde',
    },
  ]
}
// Esta tela monta a página Dashboard.

function PaginaDashboard() {
  const [resumo, setResumo] = useState(null)
  const [semana, setSemana] = useState(null)
  const [erro, setErro] = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState(null)

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    let ativo = true
    const atualizar = () => {
      Promise.all([dashboardServico.resumo(), dashboardServico.consumoDaSemana()])
        .then(([dadosResumo, dadosSemana]) => {
          if (!ativo) return
          setResumo(dadosResumo)
          setSemana(dadosSemana)
          setAtualizadoEm(new Date())
          setErro('')
        })
        .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar o dashboard.')))
    }
    atualizar()
    const intervalo = window.setInterval(atualizar, 15_000)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [])

  if (!resumo || !semana) {
    return erro ? (
      <Alerta variante="erro">{erro}</Alerta>
    ) : (
      <div className="dashboard-loading" role="status">
        Carregando dados do dashboard...
      </div>
    )
  }

  return (
    <>
      <p className="demo-data-note">
        Dados simulados (loja de demonstração)
        {atualizadoEm && ` · Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
      </p>
      <section className="metrics-grid" aria-label="Indicadores de energia">
        {montarIndicadores(resumo).map((indicador) => (
          <CartaoIndicador key={indicador.id} indicador={indicador} />
        ))}
      </section>
      <GraficoConsumoSemanal
        dados={{
          rotulos: semana.dias.map((dia) => diaDaSemana(dia.data)),
          consumoKwh: semana.dias.map((dia) => dia.consumoKwh),
          metaKwh: semana.dias.map(() => semana.metaDiariaKwh),
        }}
      />
    </>
  )
}

export default PaginaDashboard
