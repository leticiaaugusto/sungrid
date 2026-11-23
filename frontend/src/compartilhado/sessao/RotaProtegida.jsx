import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { estaLogado } from './sessao.js'

/**
 * Protege as telas internas (RN08): sem sessão, volta para o login e
 * guarda a tela que o usuário tentou abrir para voltar depois de entrar.
 */
function RotaProtegida() {
  const localizacao = useLocation()

  if (!estaLogado()) {
    return <Navigate to="/login" replace state={{ voltarPara: localizacao.pathname + localizacao.search }} />
  }

  return <Outlet />
}

export default RotaProtegida
