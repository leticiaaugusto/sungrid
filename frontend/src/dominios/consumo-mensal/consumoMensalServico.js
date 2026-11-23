/**
 * Chamadas à API da tela Consumo Mensal.
 */
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'
import { hojeIso } from '../../compartilhado/utilitarios/formatacao.js'

const mesAtual = () => hojeIso().slice(0, 7)

export const consumoMensalServico = {
  /** GET /consumo/mensal/:mes — totais, comparação, projeção e dias do mês (RF16–RF18, RF20). */
  doMes(mes = mesAtual()) {
    return requisicaoApi(`/consumo/mensal/${encodeURIComponent(mes)}`)
  },

  /** GET /economia/estimativa?mes= — economia em kWh e em reais (RF19). */
  economia(mes = mesAtual()) {
    return requisicaoApi(`/economia/estimativa?mes=${encodeURIComponent(mes)}`)
  },
}
