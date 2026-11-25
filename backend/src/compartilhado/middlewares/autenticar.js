
import jwt from 'jsonwebtoken'
import { ambiente } from '../../config/ambiente.js'
import { erros } from '../erros.js'
// Esta função executa a ação solicitada.

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
