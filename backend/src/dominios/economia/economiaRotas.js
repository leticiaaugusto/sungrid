/**
 * Rotas de economia (tela Consumo Mensal) e sustentabilidade (Pegada de Carbono no menu).
 */
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { EconomiaService } from './EconomiaService.js'

export const economiaRotas = Router()
economiaRotas.use(autenticar)

// GET /api/v1/economia/estimativa?mes= — economia em kWh e em reais (RF19)
economiaRotas.get('/estimativa', async (req, res) => {
  res.json(await EconomiaService.estimativaDoMes(req.query.mes))
})

export const sustentabilidadeRotas = Router()
sustentabilidadeRotas.use(autenticar)

// GET /api/v1/sustentabilidade/carbono?periodo=semana — CO₂ evitado (RF12)
sustentabilidadeRotas.get('/carbono', async (req, res) => {
  res.json(await EconomiaService.carbonoEvitado(req.query))
})
