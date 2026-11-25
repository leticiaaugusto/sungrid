
import { erros } from '../../compartilhado/erros.js'
import { arredondar, diasNoMes, hoje, mesAtual, somarDias, validarMes } from '../../compartilhado/tempo.js'
import { consumoRepositorio } from '../consumo/consumoRepositorio.js'
import { parametrosRepositorio } from '../parametros/parametrosRepositorio.js'

// Esta constante disponibiliza EconomiaService para outras partes do projeto.

export const EconomiaService = {

  async estimativaDoMes(mes, usuarioId) {
    mes = validarMes(mes ?? mesAtual())
    const inicio = `${mes}-01`
    const fimDoMes = `${mes}-${String(diasNoMes(mes)).padStart(2, '0')}`
    const fim = mes === mesAtual() ? hoje() : fimDoMes
    if (inicio > hoje()) throw erros.requisicaoInvalida('O mês informado ainda não começou.', 'mes')

    const [totais, tarifa] = await Promise.all([
      consumoRepositorio.totaisDoPeriodo(inicio, fim, usuarioId),
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

  async carbonoEvitado({ periodo = 'semana' } = {}, usuarioId) {
    if (periodo !== 'semana') {
      throw erros.requisicaoInvalida('Período não suportado. Use periodo=semana.', 'periodo')
    }
    const fim = hoje()
    const inicio = somarDias(fim, -6)

    const [totais, configuracao] = await Promise.all([
      consumoRepositorio.totaisDoPeriodo(inicio, fim, usuarioId),
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
