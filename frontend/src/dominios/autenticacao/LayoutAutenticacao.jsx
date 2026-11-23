import { motion, useReducedMotion } from 'motion/react'
import './autenticacao.css'
import { Link } from 'react-router-dom'

function IconeSetaVoltar() {
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

/**
 * Moldura das telas de autenticação (login, cadastro, recuperar e
 * redefinir senha): cartão central com logo, título e rodapé.
 */
function LayoutAutenticacao({ titulo, subtitulo, children, rodape, className = '', linkVoltar }) {
  const reduzirMovimento = useReducedMotion()

  return (
    <main className="auth-page">
      <motion.section
        className={`auth-card ${className}`.trim()}
        initial={reduzirMovimento ? false : { y: 7 }}
        animate={{ y: 0 }}
        layout
        transition={{
          layout: reduzirMovimento
            ? { duration: 0 }
            : { type: 'spring', stiffness: 260, damping: 30 },
          y: { duration: reduzirMovimento ? 0 : 0.24, ease: 'easeOut' },
        }}
      >
        {linkVoltar && (
          <Link className="auth-back" to={linkVoltar} aria-label="Voltar para login">
            <IconeSetaVoltar />
          </Link>
        )}
        <header className="auth-header">
          <img
            className="auth-logo"
            src="/sungrid-logo.jpg"
            alt=""
            aria-hidden="true"
          />
          <h1>{titulo}</h1>
          <p>{subtitulo}</p>
        </header>
        {children}
        {rodape && <footer className="auth-footer">{rodape}</footer>}
      </motion.section>
    </main>
  )
}

export default LayoutAutenticacao
