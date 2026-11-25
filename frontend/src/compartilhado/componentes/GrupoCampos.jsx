
function GrupoCampos({ children, className = '' }) {
  return (
    <div className={`field-group ${className}`.trim()} data-slot="field-group">
      {children}
    </div>
  )
}

function Campo({ children, className = '' }) {
  return (
    <div className={`field ${className}`.trim()} data-slot="field">
      {children}
    </div>
  )
}

function RotuloCampo({ htmlFor, children }) {
  return (
    <label className="field-label" htmlFor={htmlFor} data-slot="field-label">
      {children}
    </label>
  )
}

function ErroCampo({ id, children }) {
  if (!children) return null

  return (
    <p className="field-error" id={id} role="alert" data-slot="field-error">
      {children}
    </p>
  )
}

export { Campo, ErroCampo, GrupoCampos, RotuloCampo }
