
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'

// Esta constante disponibiliza ativosServico para outras partes do projeto.

export const ativosServico = {

  listar() {
    return requisicaoApi('/ativos')
  },

  detalhar(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}`)
  },

  telemetria(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/telemetria`)
  },

  historico(id, dias = 7) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/historico?dias=${dias}`)
  },

  reiniciar(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/reiniciar`, { metodo: 'POST', corpo: {} })
  },

  criar(dados) {
    return requisicaoApi('/ativos', { metodo: 'POST', corpo: dados })
  },

  editar(id, dados) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: dados })
  },
}
