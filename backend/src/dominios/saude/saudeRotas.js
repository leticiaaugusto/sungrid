/**
 * Rota de monitoramento (RNF15): verifica se a API e o banco estão no ar.
 */
import { Router } from 'express'
import { consultar } from '../../config/banco.js'
import { controleSimulacao } from '../simulador/controleSimulacao.js'

export const saudeRotas = Router()

// GET /api/v1/health
saudeRotas.get('/', async (_req, res) => {
  try {
    await consultar('SELECT 1')
    res.json({ status: 'ok', banco: 'ok', simulador: controleSimulacao.estaEmExecucao() ? 'ativo' : 'desligado' })
  } catch {
    res.status(503).json({ status: 'erro', banco: 'indisponível' })
  }
})
