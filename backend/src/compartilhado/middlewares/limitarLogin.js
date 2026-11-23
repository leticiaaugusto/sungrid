/**
 * Limite de tentativas de login (RNF13 — proteção contra força bruta).
 *
 * Cada endereço IP pode tentar entrar no máximo 5 vezes a cada 15 minutos.
 * Depois disso a API responde 429 até a janela expirar.
 */
import rateLimit from 'express-rate-limit'

export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Só conta tentativas que falharam: quem acerta a senha não é bloqueado.
  skipSuccessfulRequests: true,
  message: { mensagem: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
})
