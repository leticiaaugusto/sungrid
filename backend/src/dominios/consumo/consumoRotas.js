
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { somenteAdministrador } from '../../compartilhado/middlewares/somenteAdministrador.js'
import { ConsumoService } from './ConsumoService.js'

// Esta constante disponibiliza consumoRotas para outras partes do projeto.

export const consumoRotas = Router()
consumoRotas.use(autenticar)
consumoRotas.use(somenteAdministrador)

consumoRotas.get('/diario', async (req, res) => {
  res.json(await ConsumoService.consumoPorDia(req.query, req.usuario.id))
})

consumoRotas.get('/horario', async (req, res) => {
  res.json(await ConsumoService.consumoPorHora(req.query, req.usuario.id))
})

consumoRotas.get('/mensal/:mes', async (req, res) => {
  res.json(await ConsumoService.consumoMensal(req.params.mes, req.usuario.id))
})
