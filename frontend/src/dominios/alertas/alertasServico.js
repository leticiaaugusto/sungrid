/**
 * Chamadas à API da tela Gerenciamento de Alertas.
 */
import { baixarArquivoApi, requisicaoApi } from '../../compartilhado/api/clienteApi.js'

function montarFiltros({ status = 'todos', prioridade = 'todas', formato } = {}) {
  const parametros = new URLSearchParams()
  if (status !== 'todos') parametros.set('status', status)
  if (prioridade !== 'todas') parametros.set('prioridade', prioridade)
  if (formato) parametros.set('formato', formato)
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

export const alertasServico = {
  /** GET /alertas?status=&prioridade= — filtros combinados (RN31). */
  listar(filtros) {
    return requisicaoApi(`/alertas${montarFiltros(filtros)}`)
  },

  /** GET /alertas/exportar — baixa o relatório em csv, xlsx ou pdf (RF26). */
  exportar(filtros) {
    return baixarArquivoApi(`/alertas/exportar${montarFiltros(filtros)}`, `relatorio-alertas.${filtros.formato}`)
  },
}
