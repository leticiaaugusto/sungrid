
import { mesAtual } from '../../compartilhado/tempo.js'
import { AlertaService } from '../alertas/AlertaService.js'
import { ConsumoService } from '../consumo/ConsumoService.js'
import { EconomiaService } from '../economia/EconomiaService.js'

// Esta constante disponibiliza DashboardService para outras partes do projeto.

export const DashboardService = {
  async resumo(usuarioId) {
    const mes = mesAtual()
    const [consumoDia, consumoMes, alertas, economia] = await Promise.all([
      ConsumoService.consumoDoDia(usuarioId),
      ConsumoService.consumoMensal(mes, usuarioId),
      AlertaService.contarAtivos(usuarioId),

      EconomiaService.estimativaDoMes(mes, usuarioId),
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
