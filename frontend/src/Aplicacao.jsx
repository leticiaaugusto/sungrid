import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LayoutPainel from './compartilhado/layout/LayoutPainel.jsx'
import RotaProtegida, { RotaAdministrador } from './compartilhado/sessao/RotaProtegida.jsx'
import { obterUsuario } from './compartilhado/sessao/sessao.js'
import PaginaCadastro from './dominios/autenticacao/PaginaCadastro.jsx'
import PaginaLogin from './dominios/autenticacao/PaginaLogin.jsx'
import PaginaRecuperarSenha from './dominios/autenticacao/PaginaRecuperarSenha.jsx'
import PaginaRedefinirSenha from './dominios/autenticacao/PaginaRedefinirSenha.jsx'

const PaginaDashboard = lazy(() => import('./dominios/dashboard/PaginaDashboard.jsx'))
const PaginaConsumoDiario = lazy(() => import('./dominios/consumo-diario/PaginaConsumoDiario.jsx'))
const PaginaConsumoMensal = lazy(() => import('./dominios/consumo-mensal/PaginaConsumoMensal.jsx'))
const PaginaAlertas = lazy(() => import('./dominios/alertas/PaginaAlertas.jsx'))
const PaginaListaAtivos = lazy(() => import('./dominios/ativos/PaginaListaAtivos.jsx'))
const PaginaAcompanhamentoAtivo = lazy(() => import('./dominios/ativos/PaginaAcompanhamentoAtivo.jsx'))
const PaginaMinhaConta = lazy(() => import('./dominios/usuarios/PaginaMinhaConta.jsx'))
const PaginaUsuarios = lazy(() => import('./dominios/usuarios/PaginaUsuarios.jsx'))
// Este componente prepara o conteúdo da tela.

function ComCarregamento({ mensagem, children }) {
  return (
    <Suspense
      fallback={
        <div className="dashboard-loading" role="status">
          {mensagem}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

// Esta função envia usuários sem acesso para a tela de ativos.
function RotaNaoEncontrada() {
  return <Navigate to={obterUsuario()?.papel === 'OPERADOR' ? '/ativos' : '/dashboard'} replace />
}

function Aplicacao() {
  return (
    <BrowserRouter>
      {/* Esta seção reúne as telas públicas e as telas que exigem login. */}
      <Routes>
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/cadastro" element={<PaginaCadastro />} />
        <Route path="/recuperar-senha" element={<PaginaRecuperarSenha />} />
        <Route path="/redefinir-senha" element={<PaginaRedefinirSenha />} />

        <Route element={<RotaProtegida />}>
          <Route element={<LayoutPainel />}>
            <Route element={<RotaAdministrador />}>
              <Route
                path="/dashboard"
                element={
                  <ComCarregamento mensagem="Carregando dados do dashboard...">
                    <PaginaDashboard />
                  </ComCarregamento>
                }
              />
              <Route
                path="/consumo-diario"
                element={
                  <ComCarregamento mensagem="Carregando consumo diário...">
                    <PaginaConsumoDiario />
                  </ComCarregamento>
                }
              />
              <Route
                path="/consumo-mensal"
                element={
                  <ComCarregamento mensagem="Carregando consumo mensal...">
                    <PaginaConsumoMensal />
                  </ComCarregamento>
                }
              />
              <Route
                path="/alertas"
                element={
                  <ComCarregamento mensagem="Carregando alertas...">
                    <PaginaAlertas />
                  </ComCarregamento>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ComCarregamento mensagem="Carregando sua conta...">
                    <PaginaMinhaConta />
                  </ComCarregamento>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ComCarregamento mensagem="Carregando usuários...">
                    <PaginaUsuarios />
                  </ComCarregamento>
                }
              />
            </Route>
            <Route
              path="/ativos"
              element={
                <ComCarregamento mensagem="Carregando ativos...">
                  <PaginaListaAtivos />
                </ComCarregamento>
              }
            />
            <Route
              path="/ativos/:id"
              element={
                <ComCarregamento mensagem="Carregando acompanhamento do ativo...">
                  <PaginaAcompanhamentoAtivo />
                </ComCarregamento>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<RotaNaoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Aplicacao
