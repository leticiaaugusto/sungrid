
import { requisicaoApi } from '../api/clienteApi.js'

// Esta constante disponibiliza layoutServico para outras partes do projeto.

export const layoutServico = {

  usuarioLogado() {
    return requisicaoApi('/auth/me')
  },

  carbonoDaSemana() {
    return requisicaoApi('/sustentabilidade/carbono?periodo=semana')
  },

  alertasAtivos() {
    return requisicaoApi('/alertas?status=ativo')
  },

  buscarAtivos(termo) {
    return requisicaoApi(`/ativos?busca=${encodeURIComponent(termo)}`)
  },
}
