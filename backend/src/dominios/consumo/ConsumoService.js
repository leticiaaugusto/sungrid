/**
 * ConsumoService: regras das telas Consumo Diário e Consumo Mensal e do
 * gráfico semanal do Dashboard.
 *
 * Regras atendidas: RN13, RN14, RN15, RN16, RN17, RN19, RN21, RN22,
 * RN23, RN24, RN25, RN26 e RN28. Decisões que o relatório deixa
 * pendentes estão marcadas com "DECISÃO" para facilitar a revisão.
 */
import { FUSO_HORARIO } from '../../config/ambiente.js'
import { erros } from '../../compartilhado/erros.js'
import {
  arredondar,
  diasNoMes,
  hoje,
  mesAnterior,
  mesAtual,
  somarDias,
  validarData,
  validarMes,
  variacaoPercentual,
} from '../../compartilhado/tempo.js'
import { parametrosRepositorio } from '../parametros/parametrosRepositorio.js'
import { consumoRepositorio } from './consumoRepositorio.js'

/** Tamanho da janela de "horário de pico" exibida na tela (em horas). */
const JANELA_PICO_HORAS = 2

/** Hora atual no fuso oficial, no formato HH:MM. */
function horarioAtual() {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_HORARIO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}

/** Lista de datas AAAA-MM-DD de `inicio` até `fim` (inclusive). */
function listarDias(inicio, fim) {
  const dias = []
  for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) dias.push(dia)
  return dias
}

export const ConsumoService = {
  /**
   * Consumo por dia em um intervalo + meta diária (gráfico semanal — RF11 / RN19).
   * Padrão: os últimos 7 dias, incluindo hoje.
   *
   * DECISÃO (DP05 / DP15): a linha de meta usa a "meta de consumo diário"
   * da tabela configuracao, que é o único valor de meta existente no banco.
   */
  async consumoPorDia({ inicio, fim } = {}) {
    fim = fim ? validarData(fim, 'fim') : hoje()
    inicio = inicio ? validarData(inicio, 'inicio') : somarDias(fim, -6)
    if (inicio > fim) throw erros.requisicaoInvalida('A data inicial deve ser anterior à final.', 'inicio')

    const [totais, configuracao] = await Promise.all([
      consumoRepositorio.totaisPorDia(inicio, fim),
      parametrosRepositorio.buscarConfiguracao(),
    ])
    const porDia = new Map(totais.map((total) => [total.dia, total]))

    return {
      inicio,
      fim,
      metaDiariaKwh: configuracao.metaConsumoDiarioKwh,
      dias: listarDias(inicio, fim).map((data) => ({
        data,
        // null = sem leituras naquele dia (RN24), diferente de consumo zero.
        consumoKwh: arredondar(porDia.get(data)?.consumoKwh ?? null),
        geracaoKwh: arredondar(porDia.get(data)?.geracaoKwh ?? null),
      })),
    }
  },

  /**
   * Geração x consumo por hora de um dia + indicadores (RF13, RF14, RF15).
   */
  async consumoPorHora({ data } = {}) {
    data = data ? validarData(data) : hoje()

    const [horas, picoConsumo, picoSolar] = await Promise.all([
      consumoRepositorio.totaisPorHora(data),
      consumoRepositorio.picoDeConsumo(data),
      consumoRepositorio.picoSolar(data),
    ])
    const porHora = new Map(horas.map((hora) => [hora.hora, hora]))

    // RN21: as 24 horas do dia; horas sem leitura ficam com null (não zero).
    const serie = Array.from({ length: 24 }, (_, hora) => {
      const registro = porHora.get(hora)
      return {
        hora,
        temLeitura: Boolean(registro),
        // kWh na hora = potência média em kW (a hora dura 1 h) — RN15.
        consumoKw: arredondar(registro?.consumoKwh ?? null),
        geracaoKw: arredondar(registro?.geracaoKwh ?? null),
      }
    })

    const horasComLeitura = serie.filter((hora) => hora.temLeitura)
    const totalConsumoKwh = horasComLeitura.reduce((soma, hora) => soma + (hora.consumoKw ?? 0), 0)
    const totalGeracaoKwh = horasComLeitura.reduce((soma, hora) => soma + (hora.geracaoKw ?? 0), 0)

    // RN23 — DECISÃO (DP04): média = energia consumida / horas com leitura,
    // ou seja, a potência média consumida no período medido (kW).
    const mediaPotenciaKw = horasComLeitura.length ? totalConsumoKwh / horasComLeitura.length : null

    // Janela de 2 h consecutivas com maior geração ("Horário de Pico").
    let janelaPico = null
    for (let inicio = 0; inicio <= 24 - JANELA_PICO_HORAS; inicio += 1) {
      const soma = serie
        .slice(inicio, inicio + JANELA_PICO_HORAS)
        .reduce((total, hora) => total + (hora.geracaoKw ?? 0), 0)
      if (soma > 0 && (!janelaPico || soma > janelaPico.geracaoKwh)) {
        janelaPico = { inicio, fim: inicio + JANELA_PICO_HORAS, geracaoKwh: arredondar(soma) }
      }
    }

    return {
      data,
      diaCompleto: data < hoje(),
      horas: serie,
      // DECISÃO (RN22 / DP04): pico solar = leitura de 15 min com a maior
      // potência gerada somando os inversores.
      picoSolar: picoSolar && { ...picoSolar, potenciaKw: arredondar(picoSolar.potenciaKw) },
      picoConsumo: picoConsumo && { ...picoConsumo, potenciaKw: arredondar(picoConsumo.potenciaKw) },
      mediaPotenciaKw: arredondar(mediaPotenciaKw),
      totalConsumoKwh: arredondar(totalConsumoKwh),
      totalGeracaoKwh: arredondar(totalGeracaoKwh),
      janelaMaiorGeracao: janelaPico,
    }
  },

  /**
   * Tela Consumo Mensal (RF16, RF17, RF18, RF20).
   * @param {string} mes AAAA-MM
   */
  async consumoMensal(mes) {
    mes = validarMes(mes ?? mesAtual())
    const totalDias = diasNoMes(mes)
    const inicio = `${mes}-01`
    const fimDoMes = `${mes}-${String(totalDias).padStart(2, '0')}`
    const ehMesCorrente = mes === mesAtual()
    // No mês corrente só existem dados até hoje (RN17: limites do período).
    const fim = ehMesCorrente ? hoje() : fimDoMes
    if (inicio > hoje()) throw erros.requisicaoInvalida('O mês informado ainda não começou.', 'mes')

    const anterior = mesAnterior(mes)
    const diasDecorridos = Number(fim.slice(8, 10))
    const totalDiasAnterior = diasNoMes(anterior)
    const fimAnteriorEquivalente = `${anterior}-${String(Math.min(diasDecorridos, totalDiasAnterior)).padStart(2, '0')}`

    const [porDia, totaisMes, totaisAnteriorCompleto, totaisAnteriorEquivalente, configuracao] = await Promise.all([
      consumoRepositorio.totaisPorDia(inicio, fim),
      consumoRepositorio.totaisDoPeriodo(inicio, fim),
      consumoRepositorio.totaisDoPeriodo(`${anterior}-01`, `${anterior}-${totalDiasAnterior}`),
      consumoRepositorio.totaisDoPeriodo(`${anterior}-01`, fimAnteriorEquivalente),
      parametrosRepositorio.buscarConfiguracao(),
    ])

    const consumoPorData = new Map(porDia.map((dia) => [dia.dia, dia.consumoKwh]))
    const dias = Array.from({ length: totalDias }, (_, indice) => {
      const data = `${mes}-${String(indice + 1).padStart(2, '0')}`
      // RN24: dia sem leitura = null (não é consumo zero).
      return { dia: indice + 1, data, consumoKwh: arredondar(consumoPorData.get(data) ?? null) }
    })

    const totalKwh = totaisMes.consumoKwh
    const mediaDiariaKwh = totaisMes.diasComLeitura ? totalKwh / totaisMes.diasComLeitura : null

    // RN25 — fórmula proposta (seção 4): média diária x dias do mês.
    const projecaoKwh = ehMesCorrente && mediaDiariaKwh !== null ? mediaDiariaKwh * totalDias : totalKwh

    // RN26 — DECISÃO (DP04): a variação compara períodos EQUIVALENTES
    // (do dia 1 até o mesmo dia do mês anterior), justo com o mês em andamento.
    // Compara a MÉDIA por dia com leitura: dias sem dados não distorcem o resultado (RN24).
    const mediaAnteriorEquivalente = totaisAnteriorEquivalente.diasComLeitura
      ? totaisAnteriorEquivalente.consumoKwh / totaisAnteriorEquivalente.diasComLeitura
      : null
    const variacaoPct = variacaoPercentual(mediaDiariaKwh, mediaAnteriorEquivalente)

    const limite = configuracao.limiteContratualMesKwh
    const coberturaSolarPct = totalKwh ? (totaisMes.geracaoKwh / totalKwh) * 100 : null
    const diasSemLeitura = diasDecorridos - totaisMes.diasComLeitura

    return {
      mes,
      mesCorrente: ehMesCorrente,
      dias,
      totalKwh: arredondar(totalKwh),
      totalGeracaoKwh: arredondar(totaisMes.geracaoKwh),
      mediaDiariaKwh: arredondar(mediaDiariaKwh),
      metaDiariaKwh: configuracao.metaConsumoDiarioKwh,
      variacaoMediaVsMetaPct: variacaoPercentual(mediaDiariaKwh, configuracao.metaConsumoDiarioKwh),
      diasComLeitura: totaisMes.diasComLeitura,
      projecaoKwh: arredondar(projecaoKwh),
      limiteContratualKwh: limite,
      projecaoDentroDoLimite: limite ? projecaoKwh <= limite : null,
      comparacao: {
        mesAnterior: anterior,
        totalMesAnteriorKwh: arredondar(totaisAnteriorCompleto.consumoKwh),
        totalMesAnteriorEquivalenteKwh: arredondar(totaisAnteriorEquivalente.consumoKwh),
        diasComLeituraMesAnterior: totaisAnteriorCompleto.diasComLeitura,
        variacaoPct,
      },
      insights: ConsumoService.gerarInsights({
        variacaoPct,
        coberturaSolarPct,
        projecaoKwh,
        limite,
        ehMesCorrente,
        diasSemLeitura,
        diasComLeitura: totaisMes.diasComLeitura,
      }),
    }
  },

  /**
   * RN28: insights gerados SOMENTE a partir de condições verificáveis nos
   * dados. Sem dados suficientes, o texto diz isso em vez de concluir algo.
   */
  gerarInsights({ variacaoPct, coberturaSolarPct, projecaoKwh, limite, ehMesCorrente, diasSemLeitura, diasComLeitura }) {
    const formatar = (valor) => arredondar(Math.abs(valor), 1).toLocaleString('pt-BR')

    if (!diasComLeitura) {
      return {
        comparacao: 'Ainda não há leituras suficientes neste mês para comparar com o período anterior.',
        autogeracao: 'Sem leituras de geração neste mês.',
        projecao: null,
      }
    }

    let comparacao
    if (variacaoPct === null) {
      comparacao = 'Não há leituras do mês anterior no mesmo período para comparação.'
    } else if (variacaoPct < 0) {
      comparacao = `O consumo médio diário está ${formatar(variacaoPct)}% menor que no mesmo período do mês anterior.`
    } else {
      comparacao = `O consumo médio diário está ${formatar(variacaoPct)}% maior que no mesmo período do mês anterior.`
    }
    if (diasSemLeitura > 0) {
      comparacao += ` ${diasSemLeitura} dia(s) sem leituras não entram no cálculo.`
    }

    const autogeracao =
      coberturaSolarPct === null
        ? 'Sem consumo registrado para comparar com a geração.'
        : `A geração solar cobriu ${formatar(coberturaSolarPct)}% da energia consumida pela loja neste período.`

    let projecao = null
    if (ehMesCorrente && limite) {
      projecao =
        projecaoKwh <= limite
          ? 'A projeção do mês está dentro do limite contratual.'
          : `A projeção do mês ultrapassa o limite contratual de ${limite.toLocaleString('pt-BR')} kWh.`
    }

    return { comparacao, autogeracao, projecao }
  },

  /** Consumo de hoje e variação em relação ao mesmo dia da semana anterior (card do Dashboard — RN16). */
  async consumoDoDia() {
    const dataHoje = hoje()
    const mesmaSemanaPassada = somarDias(dataHoje, -7)
    const agora = horarioAtual()

    // DECISÃO (DP04 / RN16): compara hoje com o mesmo dia da semana passada ATÉ O MESMO HORÁRIO,
    // para não comparar um dia parcial com um dia completo.
    const [consumoHoje, consumoSemanaPassadaMesmoHorario] = await Promise.all([
      consumoRepositorio.consumoAteHorario(dataHoje, agora),
      consumoRepositorio.consumoAteHorario(mesmaSemanaPassada, agora),
    ])

    return {
      kwh: arredondar(consumoHoje),
      variacaoPct: variacaoPercentual(consumoHoje, consumoSemanaPassadaMesmoHorario),
      comparadoAte: agora,
      comparadoDia: mesmaSemanaPassada,
    }
  },
}
