
import { Auditoria } from './Auditoria.js'
import { auditoriaRepositorio } from './auditoriaRepositorio.js'

// Esta constante disponibiliza AuditoriaService para outras partes do projeto.

export const AuditoriaService = {

  async registrar(dados) {
    const registro = Auditoria.registrar(dados)
    await auditoriaRepositorio.inserir(registro)
    return registro
  },
}
