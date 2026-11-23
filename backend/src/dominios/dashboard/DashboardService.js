/**
 * DashboardService: indicadores resumidos do Dashboard Principal (RF10).
 *
 * Não tem regra própria: reúne os resultados dos serviços de consumo,
 * alertas e economia, para que os números sejam IGUAIS aos das telas
 * detalhadas (RN13).
 */
import { mesAtual } from '../../compartilhado/tempo.js'
import { AlertaService } from '../alertas/AlertaService.js'
import { ConsumoService } from '../consumo/ConsumoService.js'
import { EconomiaService } from '../economia/EconomiaService.js'

export const DashboardService = {
  async resumo() {
    const mes = mesAtual()
    const [consumoDia, consumoMes, alertas, economia] = await Promise.all([
      ConsumoService.consumoDoDia(),
      ConsumoService.consumoMensal(mes),
      AlertaService.contarAtivos(),
      // DECISÃO (DP16): a economia do Dashboard é a do MÊS corrente,
      // a mesma exibida na tela Consumo Mensal.
      EconomiaService.estimativaDoMes(mes),
    ])

    return {
      consumoDia,
      consumoMes: {
        kwh: consumoMes.totalKwh,
        variacaoPct: consumoMes.comparacao.variacaoPct,
        mes,
      },
      alertas,
      economia: {
        reais: economia.economiaReais,
        energiaGeradaKwh: economia.energiaGeradaKwh,
        mes,
      },
    }
  },
}
