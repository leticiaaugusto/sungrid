
import { Router } from 'express'
import { autenticar } from '../../compartilhado/middlewares/autenticar.js'
import { somenteAdministrador } from '../../compartilhado/middlewares/somenteAdministrador.js'
import { EconomiaService } from './EconomiaService.js'

// Esta constante disponibiliza economiaRotas para outras partes do projeto.

export const economiaRotas = Router()
economiaRotas.use(autenticar)
economiaRotas.use(somenteAdministrador)

economiaRotas.get('/estimativa', async (req, res) => {
  res.json(await EconomiaService.estimativaDoMes(req.query.mes, req.usuario.id))
})

// Esta constante disponibiliza sustentabilidadeRotas para outras partes do projeto.

export const sustentabilidadeRotas = Router()
sustentabilidadeRotas.use(autenticar)
sustentabilidadeRotas.use(somenteAdministrador)

sustentabilidadeRotas.get('/carbono', async (req, res) => {
  res.json(await EconomiaService.carbonoEvitado(req.query, req.usuario.id))
})
