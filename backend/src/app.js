/**
 * Montagem da aplicação Express.
 *
 * Todas as rotas usam o prefixo /api/v1 (RNF23) e trafegam JSON.
 * Cada domínio (tela) registra o seu próprio arquivo de rotas.
 */
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

export function criarApp() {
  const app = express()

  // Em hospedagem, as requisições passam por um proxy: isso faz req.ip ser o IP
  // real do usuário (necessário para o limite de tentativas de login).
  app.set('trust proxy', 1)

  app.use(cors({ origin: ambiente.urlFrontend, exposedHeaders: ['Content-Disposition'] }))
  app.use(express.json({ limit: '100kb' }))

  const api = express.Router()
  api.use('/auth', autenticacaoRotas) //               Login, Cadastro, Recuperar/Redefinir senha
  api.use('/usuarios', usuariosRotas) //               Conta do usuário (LGPD)
  api.use('/dashboard', dashboardRotas) //             Dashboard Principal
  api.use('/consumo', consumoRotas) //                 Consumo Diário e Mensal
  api.use('/economia', economiaRotas) //               Economia por autogeração
  api.use('/sustentabilidade', sustentabilidadeRotas) // Pegada de carbono
  api.use('/alertas', alertaRotas) //                  Gerenciamento de Alertas
  api.use('/ativos', ativoRotas) //                    Acompanhamento de Ativo + busca
  api.use('/chamados', chamadoRotas) //                Chamados
  api.use('/health', saudeRotas) //                    Monitoramento

  app.use('/api/v1', api)
  app.use(rotaNaoEncontrada)
  app.use(tratarErros)
  return app
}
