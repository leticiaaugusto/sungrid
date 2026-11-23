/**
 * Rotas de chamados.
 * (A abertura de chamado fica em ativoRotas: POST /ativos/:id/chamados.)
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { ChamadoService } from './ChamadoService.js'

export const chamadoRotas = Router()
chamadoRotas.use(autenticar)

// GET /api/v1/chamados?status= — lista os chamados abertos e resolvidos
chamadoRotas.get('/', async (req, res) => {
  res.json(await ChamadoService.listar(req.query))
})
