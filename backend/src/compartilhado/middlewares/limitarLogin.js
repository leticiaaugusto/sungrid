
import rateLimit from 'express-rate-limit'

// Esta constante disponibiliza limitarLogin para outras partes do projeto.

export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  skipSuccessfulRequests: true,
  message: { mensagem: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
})
