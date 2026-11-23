/**
 * Middleware de autenticação (RN08 / RNF11).
 *
 * Exige o cabeçalho `Authorization: Bearer <token>` com um JWT válido.
 * Quando o token é válido, guarda em `req.usuario` o id e o papel do
 * usuário logado para as próximas camadas usarem.
 */
import jwt from 'jsonwebtoken'
import { ambiente } from '../../config/ambiente.js'
import { erros } from '../erros.js'

export function autenticar(req, _res, next) {
  const cabecalho = req.headers.authorization ?? ''
  const [tipo, token] = cabecalho.split(' ')

  if (tipo !== 'Bearer' || !token) {
    throw erros.naoAutenticado('Faça login para acessar esta funcionalidade.')
  }

  try {
    const dados = jwt.verify(token, ambiente.jwt.segredo)
    req.usuario = { id: Number(dados.sub), papel: dados.papel }
    next()
  } catch {
    throw erros.naoAutenticado()
  }
}
