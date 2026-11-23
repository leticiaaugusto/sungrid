/**
 * Rotas das telas Consumo Diário e Consumo Mensal (e gráfico semanal do Dashboard).
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { ConsumoService } from './ConsumoService.js'

export const consumoRotas = Router()
consumoRotas.use(autenticar)

// GET /api/v1/consumo/diario?inicio=&fim= — consumo por dia e meta diária (Dashboard)
consumoRotas.get('/diario', async (req, res) => {
  res.json(await ConsumoService.consumoPorDia(req.query))
})

// GET /api/v1/consumo/horario?data= — geração e consumo por hora, picos e totais
consumoRotas.get('/horario', async (req, res) => {
  res.json(await ConsumoService.consumoPorHora(req.query))
})

// GET /api/v1/consumo/mensal/:mes — totais, comparação, projeção e dias do mês
consumoRotas.get('/mensal/:mes', async (req, res) => {
  res.json(await ConsumoService.consumoMensal(req.params.mes))
})
