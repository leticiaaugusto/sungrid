/**
 * Erros de negócio padronizados (RNF03).
 *
 * Os serviços lançam estes erros com uma mensagem em português e o
 * código HTTP adequado. O middleware `tratarErros` transforma o erro na
 * resposta JSON `{ mensagem, campo? }` que o frontend exibe ao usuário.
 */
export class ErroAplicacao extends Error {
  /**
   * @param {string} mensagem Texto exibido ao usuário.
   * @param {number} status Código HTTP.
   * @param {string} [campo] Campo do formulário relacionado ao erro.
   */
  constructor(mensagem, status = 400, campo) {
    super(mensagem)
    this.name = 'ErroAplicacao'
    this.status = status
    this.campo = campo
  }
}

export const erros = {
  requisicaoInvalida: (mensagem, campo) => new ErroAplicacao(mensagem, 400, campo),
  naoAutenticado: (mensagem = 'Sessão expirada ou inválida. Faça login novamente.') =>
    new ErroAplicacao(mensagem, 401),
  semPermissao: (mensagem = 'Seu perfil não tem permissão para esta ação.') =>
    new ErroAplicacao(mensagem, 403),
  naoEncontrado: (mensagem = 'Registro não encontrado.') => new ErroAplicacao(mensagem, 404),
  conflito: (mensagem, campo) => new ErroAplicacao(mensagem, 409, campo),
}
