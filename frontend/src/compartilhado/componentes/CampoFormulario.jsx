import { useState } from 'react'
import { Campo, ErroCampo, RotuloCampo } from './GrupoCampos.jsx'

/** Ícone de olho para mostrar/ocultar a senha. */
function IconeOlho({ visivel }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visivel ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.7 10.7 0 0112 5c5.4 0 9 5 9 7a9.9 9.9 0 01-3 4.2" />
          <path d="M6.2 6.2C3.9 7.7 3 10.2 3 12c0 2 3.6 7 9 7a9.5 9.5 0 004.1-.9" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  )
}

/**
 * Campo de formulário com rótulo, marcação de obrigatório, mensagem de
 * erro e botão de mostrar senha (quando tipo="password").
 * O `id` também é o `name` do input (usado no FormData).
 */
function CampoFormulario({
  id,
  rotulo,
  tipo = 'text',
  placeholder,
  autoComplete,
  obrigatorio = true,
  minLength,
  erro,
  onChange,
}) {
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const ehSenha = tipo === 'password'

  return (
    <Campo className="form-field">
      <RotuloCampo htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <>
            <span className="required-mark" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> obrigatório</span>
          </>
        )}
      </RotuloCampo>
      <div className={`input-wrap${ehSenha ? ' input-wrap--password' : ''}`}>
        <input
          className="input-control"
          id={id}
          name={id}
          type={ehSenha && senhaVisivel ? 'text' : tipo}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={obrigatorio}
          minLength={minLength}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          onChange={onChange}
        />
        {ehSenha && (
          <button
            className="password-toggle"
            type="button"
            onClick={() => setSenhaVisivel((visivel) => !visivel)}
            aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={senhaVisivel}
          >
            <IconeOlho visivel={senhaVisivel} />
          </button>
        )}
      </div>
      <ErroCampo id={`${id}-erro`}>{erro}</ErroCampo>
    </Campo>
  )
}

export default CampoFormulario
