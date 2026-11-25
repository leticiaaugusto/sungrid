import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { estaLogado, obterUsuario } from './sessao.js'

function RotaProtegida() {
  const localizacao = useLocation()

  if (!estaLogado()) {
    return <Navigate to="/login" replace state={{ voltarPara: localizacao.pathname + localizacao.search }} />
  }

  return <Outlet />
}

export default RotaProtegida

// Esta rota permite que operadores vejam apenas os módulos de ativos.
export function RotaAdministrador() {
  const usuario = obterUsuario()
  if (usuario?.papel === 'OPERADOR') {
    return <Navigate to="/ativos" replace />
  }
  return <Outlet />
}
