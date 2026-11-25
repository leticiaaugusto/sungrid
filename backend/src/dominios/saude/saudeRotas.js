
import { Router } from 'express'
import { consultar } from '../../config/banco.js'
import { controleSimulacao } from '../simulador/controleSimulacao.js'

// Esta constante disponibiliza saudeRotas para outras partes do projeto.

export const saudeRotas = Router()

saudeRotas.get('/', async (_req, res) => {
  try {
    await consultar('SELECT 1')
    res.json({ status: 'ok', banco: 'ok', simulador: controleSimulacao.estaEmExecucao() ? 'ativo' : 'desligado' })
  } catch {
    res.status(503).json({ status: 'erro', banco: 'indisponível' })
  }
})
