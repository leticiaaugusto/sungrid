/**
 * AuditoriaService: registra ações sensíveis (RNF13).
 *
 * Os demais serviços chamam `AuditoriaService.registrar(...)` depois de
 * login, reinício de ativo, abertura de chamado, exportação de relatório
 * e operações de LGPD.
 */
import { Auditoria } from './Auditoria.js'
import { auditoriaRepositorio } from './auditoriaRepositorio.js'

export const AuditoriaService = {
  /**
   * @param {{ usuarioId?: number, acao: string, alvo?: { entidade: string, id: number }, ip?: string, detalhes?: object }} dados
   */
  async registrar(dados) {
    const registro = Auditoria.registrar(dados)
    await auditoriaRepositorio.inserir(registro)
    return registro
  },
}
