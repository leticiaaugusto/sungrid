
import { ErroAplicacao } from '../erros.js'

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}` })
}
// Esta função prepara ou formata o valor para exibição.

export function tratarErros(erro, _req, res, _next) {
  if (erro instanceof ErroAplicacao) {
    return res.status(erro.status).json({ mensagem: erro.message, campo: erro.campo })
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'O corpo da requisição não é um JSON válido.' })
  }

  console.error('[erro]', erro)
  return res.status(500).json({ mensagem: 'Erro interno no servidor. Tente novamente em instantes.' })
}
