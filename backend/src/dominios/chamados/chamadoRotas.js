
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { somenteAdministrador } from '../../compartilhado/middlewares/somenteAdministrador.js'
import { ChamadoService } from './ChamadoService.js'

// Esta constante disponibiliza chamadoRotas para outras partes do projeto.

export const chamadoRotas = Router()
chamadoRotas.use(autenticar)
chamadoRotas.use(somenteAdministrador)

chamadoRotas.get('/', async (req, res) => {
  res.json(await ChamadoService.listar(req.query))
})
