import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LayoutPainel from './compartilhado/layout/LayoutPainel.jsx'
import RotaProtegida from './compartilhado/sessao/RotaProtegida.jsx'
import PaginaCadastro from './dominios/autenticacao/PaginaCadastro.jsx'
import PaginaLogin from './dominios/autenticacao/PaginaLogin.jsx'
import PaginaRecuperarSenha from './dominios/autenticacao/PaginaRecuperarSenha.jsx'
import PaginaRedefinirSenha from './dominios/autenticacao/PaginaRedefinirSenha.jsx'

// As telas internas são carregadas sob demanda (deixa o login mais leve).
const PaginaDashboard = lazy(() => import('./dominios/dashboard/PaginaDashboard.jsx'))
const PaginaConsumoDiario = lazy(() => import('./dominios/consumo-diario/PaginaConsumoDiario.jsx'))
const PaginaConsumoMensal = lazy(() => import('./dominios/consumo-mensal/PaginaConsumoMensal.jsx'))
const PaginaAlertas = lazy(() => import('./dominios/alertas/PaginaAlertas.jsx'))
const PaginaListaAtivos = lazy(() => import('./dominios/ativos/PaginaListaAtivos.jsx'))
const PaginaAcompanhamentoAtivo = lazy(() => import('./dominios/ativos/PaginaAcompanhamentoAtivo.jsx'))
const PaginaMinhaConta = lazy(() => import('./dominios/usuarios/PaginaMinhaConta.jsx'))
const PaginaUsuarios = lazy(() => import('./dominios/usuarios/PaginaUsuarios.jsx'))

/** Envolve uma tela interna com a mensagem de carregamento. */
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

/**
 * Rotas da aplicação. Cada domínio (pasta em src/dominios) corresponde a
 * uma tela do protótipo.
 */
function Aplicacao() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Telas públicas (autenticação) */}
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/cadastro" element={<PaginaCadastro />} />
        <Route path="/recuperar-senha" element={<PaginaRecuperarSenha />} />
        <Route path="/redefinir-senha" element={<PaginaRedefinirSenha />} />

        {/* Telas internas: exigem login (RN08) */}
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutPainel />}>
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
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Aplicacao
