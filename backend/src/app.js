
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { ambiente } from './config/ambiente.js'
import { rotaNaoEncontrada, tratarErros } from './compartilhado/middlewares/tratarErros.js'
import { alertaRotas } from './dominios/alertas/alertaRotas.js'
import { ativoRotas } from './dominios/ativos/ativoRotas.js'
import { autenticacaoRotas } from './dominios/autenticacao/autenticacaoRotas.js'
import { chamadoRotas } from './dominios/chamados/chamadoRotas.js'
import { consumoRotas } from './dominios/consumo/consumoRotas.js'
import { dashboardRotas } from './dominios/dashboard/dashboardRotas.js'
import { economiaRotas, sustentabilidadeRotas } from './dominios/economia/economiaRotas.js'
import { saudeRotas } from './dominios/saude/saudeRotas.js'
import { usuariosRotas } from './dominios/usuarios/usuariosRotas.js'

const PASTA_SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist')
// Esta função grava ou atualiza os dados.

export function criarApp() {
  const app = express()

  app.set('trust proxy', 1)

  app.use(cors({ origin: ambiente.urlFrontend, exposedHeaders: ['Content-Disposition'] }))
  app.use(express.json({ limit: '100kb' }))

  const api = express.Router()
  api.use('/auth', autenticacaoRotas)
  api.use('/usuarios', usuariosRotas)
  api.use('/dashboard', dashboardRotas)
  api.use('/consumo', consumoRotas)
  api.use('/economia', economiaRotas)
  api.use('/sustentabilidade', sustentabilidadeRotas)
  api.use('/alertas', alertaRotas)
  api.use('/ativos', ativoRotas)
  api.use('/chamados', chamadoRotas)
  api.use('/health', saudeRotas)

  app.use('/api/v1', api)

  if (existsSync(PASTA_SITE)) {
    app.use(express.static(PASTA_SITE))

    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
      res.sendFile(path.join(PASTA_SITE, 'index.html'))
    })
  }

  app.use(rotaNaoEncontrada)
  app.use(tratarErros)
  return app
}
