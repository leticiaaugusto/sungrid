/**
 * Chamadas à API da tela Consumo Diário.
 */
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'
import { hojeIso } from '../../compartilhado/utilitarios/formatacao.js'

export const consumoDiarioServico = {
  /** GET /consumo/horario?data= — geração e consumo por hora, picos e totais (RF13–RF15). */
  porHora(data = hojeIso()) {
    return requisicaoApi(`/consumo/horario?data=${encodeURIComponent(data)}`)
  },
}
