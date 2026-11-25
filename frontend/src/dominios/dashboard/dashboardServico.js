
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'

// Esta constante disponibiliza dashboardServico para outras partes do projeto.

export const dashboardServico = {

  resumo() {
    return requisicaoApi('/dashboard/resumo')
  },

  consumoDaSemana() {
    return requisicaoApi('/consumo/diario')
  },
}
