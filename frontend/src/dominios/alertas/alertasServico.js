
import { baixarArquivoApi, requisicaoApi } from '../../compartilhado/api/clienteApi.js'
// Esta função organiza os dados antes de enviá-los ou exibí-los.

function montarFiltros({ status = 'todos', prioridade = 'todas', formato } = {}) {
  const parametros = new URLSearchParams()
  if (status !== 'todos') parametros.set('status', status)
  if (prioridade !== 'todas') parametros.set('prioridade', prioridade)
  if (formato) parametros.set('formato', formato)
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

// Esta constante disponibiliza alertasServico para outras partes do projeto.

export const alertasServico = {

  listar(filtros) {
    return requisicaoApi(`/alertas${montarFiltros(filtros)}`)
  },

  exportar(filtros) {
    return baixarArquivoApi(`/alertas/exportar${montarFiltros(filtros)}`, `relatorio-alertas.${filtros.formato}`)
  },
}
