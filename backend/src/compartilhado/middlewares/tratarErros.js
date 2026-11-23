/**
 * Tratamento central de erros (RNF03).
 *
 * Qualquer erro lançado em rotas, serviços ou repositórios chega aqui
 * (o Express 5 captura também erros de funções `async`). A resposta é
 * sempre JSON no formato `{ mensagem, campo? }`, em português.
 */
import { ErroAplicacao } from '../erros.js'

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}` })
}

// O Express reconhece o middleware de erro pelos 4 parâmetros.
// eslint-disable-next-line no-unused-vars
export function tratarErros(erro, _req, res, _next) {
  if (erro instanceof ErroAplicacao) {
    return res.status(erro.status).json({ mensagem: erro.message, campo: erro.campo })
  }

  // Corpo da requisição com JSON malformado.
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'O corpo da requisição não é um JSON válido.' })
  }

  // Erro inesperado: registra no terminal e não expõe detalhes ao usuário.
  console.error('[erro]', erro)
  return res.status(500).json({ mensagem: 'Erro interno no servidor. Tente novamente em instantes.' })
}
