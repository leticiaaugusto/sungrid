/**
 * Chamadas à API do Dashboard Principal.
 */
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'

export const dashboardServico = {
  /** GET /dashboard/resumo — consumo do dia e do mês, alertas e economia (RF10). */
  resumo() {
    return requisicaoApi('/dashboard/resumo')
  },

  /** GET /consumo/diario — consumo dos últimos 7 dias e meta diária (RF11). */
  consumoDaSemana() {
    return requisicaoApi('/consumo/diario')
  },
}
