
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

const JANELA_PICO_HORAS = 2

function horarioAtual() {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_HORARIO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}
// Esta função busca os dados necessários.

function listarDias(inicio, fim) {
  const dias = []
  for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) dias.push(dia)
  return dias
}

// Esta constante disponibiliza ConsumoService para outras partes do projeto.

export const ConsumoService = {

  async consumoPorDia({ inicio, fim } = {}, usuarioId) {
    fim = fim ? validarData(fim, 'fim') : hoje()
    inicio = inicio ? validarData(inicio, 'inicio') : somarDias(fim, -6)
    if (inicio > fim) throw erros.requisicaoInvalida('A data inicial deve ser anterior à final.', 'inicio')

    const [totais, configuracao] = await Promise.all([
      consumoRepositorio.totaisPorDia(inicio, fim, usuarioId),
      parametrosRepositorio.buscarConfiguracao(),
    ])
    const porDia = new Map(totais.map((total) => [total.dia, total]))

    return {
      inicio,
      fim,
      metaDiariaKwh: configuracao.metaConsumoDiarioKwh,
      dias: listarDias(inicio, fim).map((data) => ({
        data,

        consumoKwh: arredondar(porDia.get(data)?.consumoKwh ?? null),
        geracaoKwh: arredondar(porDia.get(data)?.geracaoKwh ?? null),
      })),
    }
  },

  async consumoPorHora({ data } = {}, usuarioId) {
    data = data ? validarData(data) : hoje()

    const [horas, picoConsumo, picoSolar] = await Promise.all([
      consumoRepositorio.totaisPorHora(data, usuarioId),
      consumoRepositorio.picoDeConsumo(data, usuarioId),
      consumoRepositorio.picoSolar(data, usuarioId),
    ])
    const porHora = new Map(horas.map((hora) => [hora.hora, hora]))

    const serie = Array.from({ length: 24 }, (_, hora) => {
      const registro = porHora.get(hora)
      return {
        hora,
        temLeitura: Boolean(registro),

        consumoKw: arredondar(registro?.consumoKwh ?? null),
        geracaoKw: arredondar(registro?.geracaoKwh ?? null),
      }
    })

    const horasComLeitura = serie.filter((hora) => hora.temLeitura)
    const totalConsumoKwh = horasComLeitura.reduce((soma, hora) => soma + (hora.consumoKw ?? 0), 0)
    const totalGeracaoKwh = horasComLeitura.reduce((soma, hora) => soma + (hora.geracaoKw ?? 0), 0)

    const mediaPotenciaKw = horasComLeitura.length ? totalConsumoKwh / horasComLeitura.length : null

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

      picoSolar: picoSolar && { ...picoSolar, potenciaKw: arredondar(picoSolar.potenciaKw) },
      picoConsumo: picoConsumo && { ...picoConsumo, potenciaKw: arredondar(picoConsumo.potenciaKw) },
      mediaPotenciaKw: arredondar(mediaPotenciaKw),
      totalConsumoKwh: arredondar(totalConsumoKwh),
      totalGeracaoKwh: arredondar(totalGeracaoKwh),
      janelaMaiorGeracao: janelaPico,
    }
  },

  async consumoMensal(mes, usuarioId) {
    mes = validarMes(mes ?? mesAtual())
    const totalDias = diasNoMes(mes)
    const inicio = `${mes}-01`
    const fimDoMes = `${mes}-${String(totalDias).padStart(2, '0')}`
    const ehMesCorrente = mes === mesAtual()

    const fim = ehMesCorrente ? hoje() : fimDoMes
    if (inicio > hoje()) throw erros.requisicaoInvalida('O mês informado ainda não começou.', 'mes')

    const anterior = mesAnterior(mes)
    const diasDecorridos = Number(fim.slice(8, 10))
    const totalDiasAnterior = diasNoMes(anterior)
    const fimAnteriorEquivalente = `${anterior}-${String(Math.min(diasDecorridos, totalDiasAnterior)).padStart(2, '0')}`

    const [porDia, totaisMes, totaisAnteriorCompleto, totaisAnteriorEquivalente, configuracao] = await Promise.all([
      consumoRepositorio.totaisPorDia(inicio, fim, usuarioId),
      consumoRepositorio.totaisDoPeriodo(inicio, fim, usuarioId),
      consumoRepositorio.totaisDoPeriodo(`${anterior}-01`, `${anterior}-${totalDiasAnterior}`, usuarioId),
      consumoRepositorio.totaisDoPeriodo(`${anterior}-01`, fimAnteriorEquivalente, usuarioId),
      parametrosRepositorio.buscarConfiguracao(),
    ])

    const consumoPorData = new Map(porDia.map((dia) => [dia.dia, dia.consumoKwh]))
    const dias = Array.from({ length: totalDias }, (_, indice) => {
      const data = `${mes}-${String(indice + 1).padStart(2, '0')}`

      return { dia: indice + 1, data, consumoKwh: arredondar(consumoPorData.get(data) ?? null) }
    })

    const totalKwh = totaisMes.consumoKwh
    const mediaDiariaKwh = totaisMes.diasComLeitura ? totalKwh / totaisMes.diasComLeitura : null

    const projecaoKwh = ehMesCorrente && mediaDiariaKwh !== null ? mediaDiariaKwh * totalDias : totalKwh

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

  async consumoDoDia(usuarioId) {
    const dataHoje = hoje()
    const mesmaSemanaPassada = somarDias(dataHoje, -7)
    const agora = horarioAtual()

    const [consumoHoje, consumoSemanaPassadaMesmoHorario] = await Promise.all([
      consumoRepositorio.consumoAteHorario(dataHoje, agora, usuarioId),
      consumoRepositorio.consumoAteHorario(mesmaSemanaPassada, agora, usuarioId),
    ])

    return {
      kwh: arredondar(consumoHoje),
      variacaoPct: variacaoPercentual(consumoHoje, consumoSemanaPassadaMesmoHorario),
      comparadoAte: agora,
      comparadoDia: mesmaSemanaPassada,
    }
  },
}
