
function Alerta({ variante = 'padrao', children }) {
  const ehErro = variante === 'erro'

  return (
    <div
      className={`ui-alert ui-alert--${ehErro ? 'destructive' : 'default'}`}
      role={ehErro ? 'alert' : 'status'}
      data-slot="alert"
    >
      <span className="ui-alert__icon" aria-hidden="true">
        {ehErro ? '!' : '✓'}
      </span>
      <div className="ui-alert__content">{children}</div>
    </div>
  )
}

export default Alerta
