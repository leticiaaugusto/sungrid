
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'
import { hojeIso } from '../../compartilhado/utilitarios/formatacao.js'

// Esta constante disponibiliza consumoDiarioServico para outras partes do projeto.

export const consumoDiarioServico = {

  porHora(data = hojeIso()) {
    return requisicaoApi(`/consumo/horario?data=${encodeURIComponent(data)}`)
  },
}
