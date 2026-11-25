
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { somenteAdministrador } from '../../compartilhado/middlewares/somenteAdministrador.js'
import { DashboardService } from './DashboardService.js'

// Esta constante disponibiliza dashboardRotas para outras partes do projeto.

export const dashboardRotas = Router()
dashboardRotas.use(autenticar)
dashboardRotas.use(somenteAdministrador)

dashboardRotas.get('/resumo', async (req, res) => {
  res.json(await DashboardService.resumo(req.usuario.id))
})
