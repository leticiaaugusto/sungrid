
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'
import { hojeIso } from '../../compartilhado/utilitarios/formatacao.js'

const mesAtual = () => hojeIso().slice(0, 7)

// Esta constante disponibiliza consumoMensalServico para outras partes do projeto.

export const consumoMensalServico = {

  doMes(mes = mesAtual()) {
    return requisicaoApi(`/consumo/mensal/${encodeURIComponent(mes)}`)
  },

  economia(mes = mesAtual()) {
    return requisicaoApi(`/economia/estimativa?mes=${encodeURIComponent(mes)}`)
  },
}
