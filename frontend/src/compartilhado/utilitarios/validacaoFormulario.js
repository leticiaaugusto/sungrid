// Esta função busca os dados necessários.

export function obterErrosDoFormulario(formulario) {
  const erros = {}

  for (const campo of formulario.elements) {
    if (!(campo instanceof HTMLInputElement)) continue

    if (campo.validity.valueMissing) {
      erros[campo.name] = 'Este campo é obrigatório.'
    } else if (campo.validity.typeMismatch && campo.type === 'email') {
      erros[campo.name] = 'Digite um endereço de e-mail válido.'
    } else if (campo.validity.tooShort) {
      erros[campo.name] = `Use pelo menos ${campo.minLength} caracteres.`
    }
  }

  return erros
}
