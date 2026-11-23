/**
 * Middleware de autorização por papel (RBAC — RN09 / RNF11).
 *
 * Uso: `router.post('/rota', autorizar(ACOES.REINICIAR_ATIVO), ...)`.
 * Deve vir depois de `autenticar`, que preenche `req.usuario`.
 */
import { PERMISSOES_POR_PAPEL } from '../../dominios/autenticacao/permissoes.js'
import { usuarioRepositorio } from '../../dominios/autenticacao/usuarioRepositorio.js'
import { erros } from '../erros.js'

export function autorizar(acao) {
  return async (req, _res, next) => {
    const usuario = await usuarioRepositorio.buscarPorId(req.usuario?.id)
    if (!usuario) throw erros.naoAutenticado()
    const permissoes = PERMISSOES_POR_PAPEL[usuario.papel] ?? []
    if (!permissoes.includes(acao)) {
      throw erros.semPermissao()
    }
    next()
  }
}
