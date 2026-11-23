/**
 * Rotas do Dashboard Principal.
 * (O gráfico semanal usa GET /consumo/diario e a pegada de carbono usa
 * GET /sustentabilidade/carbono.)
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { DashboardService } from './DashboardService.js'

export const dashboardRotas = Router()
dashboardRotas.use(autenticar)

// GET /api/v1/dashboard/resumo — consumo do dia e do mês, alertas ativos e economia
dashboardRotas.get('/resumo', async (_req, res) => {
  res.json(await DashboardService.resumo())
})
