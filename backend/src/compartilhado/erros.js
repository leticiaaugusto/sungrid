
export class ErroAplicacao extends Error {

  constructor(mensagem, status = 400, campo) {
    super(mensagem)
    this.name = 'ErroAplicacao'
    this.status = status
    this.campo = campo
  }
}

// Esta constante disponibiliza erros para outras partes do projeto.

export const erros = {
  requisicaoInvalida: (mensagem, campo) => new ErroAplicacao(mensagem, 400, campo),
  naoAutenticado: (mensagem = 'Sessão expirada ou inválida. Faça login novamente.') =>
    new ErroAplicacao(mensagem, 401),
  semPermissao: (mensagem = 'Seu perfil não tem permissão para esta ação.') =>
    new ErroAplicacao(mensagem, 403),
  naoEncontrado: (mensagem = 'Registro não encontrado.') => new ErroAplicacao(mensagem, 404),
  conflito: (mensagem, campo) => new ErroAplicacao(mensagem, 409, campo),
}
