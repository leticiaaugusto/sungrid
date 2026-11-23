/**
 * EconomiaService: economia por autogeração (RN27) e CO₂ evitado (RN20).
 *
 * ATENÇÃO: as duas fórmulas são as PROPOSTAS da seção 4 do relatório e
 * ainda dependem de aprovação da equipe (DP06 e DP07). Se a fórmula
 * mudar, só este arquivo precisa ser alterado.
 */
import { erros } from '../../compartilhado/erros.js'
import { arredondar, diasNoMes, hoje, mesAtual, somarDias, validarMes } from '../../compartilhado/tempo.js'
import { consumoRepositorio } from '../consumo/consumoRepositorio.js'
import { parametrosRepositorio } from '../parametros/parametrosRepositorio.js'

export const EconomiaService = {
  /**
   * Economia estimada no mês (RF19).
   * Fórmula proposta: energia gerada no período x valor do kWh da tarifa vigente.
   */
  async estimativaDoMes(mes) {
    mes = validarMes(mes ?? mesAtual())
    const inicio = `${mes}-01`
    const fimDoMes = `${mes}-${String(diasNoMes(mes)).padStart(2, '0')}`
    const fim = mes === mesAtual() ? hoje() : fimDoMes
    if (inicio > hoje()) throw erros.requisicaoInvalida('O mês informado ainda não começou.', 'mes')

    const [totais, tarifa] = await Promise.all([
      consumoRepositorio.totaisDoPeriodo(inicio, fim),
      parametrosRepositorio.buscarTarifaVigente(fim),
    ])

    return {
      mes,
      energiaGeradaKwh: arredondar(totais.geracaoKwh),
      tarifaKwh: tarifa?.valorKwh ?? null,
      economiaReais: tarifa ? arredondar(tarifa.calcularValor(totais.geracaoKwh), 2) : null,
      formula: 'energia gerada no período x valor do kWh da tarifa vigente (proposta, sujeita à validação — RN27)',
    }
  },

  /**
   * CO₂ evitado (RF12). Hoje só existe o período "semana" (últimos 7 dias).
   * Fórmula proposta: energia gerada x fator médio de emissão do SIN.
   */
  async carbonoEvitado({ periodo = 'semana' } = {}) {
    if (periodo !== 'semana') {
      throw erros.requisicaoInvalida('Período não suportado. Use periodo=semana.', 'periodo')
    }
    const fim = hoje()
    const inicio = somarDias(fim, -6)

    const [totais, configuracao] = await Promise.all([
      consumoRepositorio.totaisDoPeriodo(inicio, fim),
      parametrosRepositorio.buscarConfiguracao(),
    ])

    return {
      periodo,
      inicio,
      fim,
      energiaGeradaKwh: arredondar(totais.geracaoKwh),
      fatorEmissaoKgco2Kwh: configuracao.fatorEmissaoKgco2Kwh,
      co2EvitadoKg: arredondar(configuracao.calcularCo2Evitado(totais.geracaoKwh)),
    }
  },
}
