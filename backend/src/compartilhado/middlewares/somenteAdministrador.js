import { erros } from '../erros.js'

export function somenteAdministrador(req, _res, next) {
  if (req.usuario?.papel !== 'ADMINISTRADOR') {
    throw erros.semPermissao()
  }
  next()
}
