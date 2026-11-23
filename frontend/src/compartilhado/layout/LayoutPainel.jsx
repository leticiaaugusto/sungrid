import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'
import Alerta from '../componentes/Alerta.jsx'
import { obterUsuario } from '../sessao/sessao.js'
import { mensagemDeErro } from '../utilitarios/formatacao.js'
import Cabecalho from './Cabecalho.jsx'
import MenuLateral from './MenuLateral.jsx'
import { layoutServico } from './layoutServico.js'
import './painel.css'

/** Intervalo de atualização do card de alertas do menu. */
const ATUALIZAR_ALERTAS_MS = 30_000

const TITULOS_POR_ROTA = {
  '/dashboard': 'Dashboard Principal',
  '/consumo-diario': 'Análise de Consumo Diário',
  '/consumo-mensal': 'Análise de Consumo Mensal',
  '/alertas': 'Gerenciamento de Alertas',
  '/ativos': 'Acompanhamento de Ativo',
  '/configuracoes': 'Minha Conta',
  '/usuarios': 'Usuários',
}

/**
 * Moldura de todas as telas internas: menu lateral + cabeçalho + conteúdo.
 * Carrega o que é comum a todas as telas: usuário logado, alertas ativos
 * e pegada de carbono. Cada tela (Outlet) busca os próprios dados.
 */
function LayoutPainel() {
  const [usuario, setUsuario] = useState(obterUsuario)
  const [alertasAtivos, setAlertasAtivos] = useState(null)
  const [carbono, setCarbono] = useState(null)
  const [erro, setErro] = useState('')
  const localizacao = useLocation()
  const reduzirMovimento = useReducedMotion()

  // Usuário logado e pegada de carbono: uma vez ao abrir.
  useEffect(() => {
    let ativo = true
    layoutServico.usuarioLogado().then((dados) => ativo && setUsuario(dados)).catch(() => {})
    layoutServico
      .carbonoDaSemana()
      .then((dados) => ativo && setCarbono(dados))
      .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar a pegada de carbono.')))
    return () => {
      ativo = false
    }
  }, [])

  // Alertas ativos: atualiza a cada 30 s.
  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      layoutServico
        .alertasAtivos()
        .then((lista) => ativo && setAlertasAtivos(lista))
        .catch((falha) => ativo && setErro(mensagemDeErro(falha, 'Não foi possível carregar os alertas.')))

    atualizar()
    const intervalo = window.setInterval(atualizar, ATUALIZAR_ALERTAS_MS)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [])

  return (
    <div className="dashboard-shell">
      <MenuLateral alertasAtivos={alertasAtivos} carbono={carbono} usuario={usuario} />
      <div className="dashboard-workspace">
        <Cabecalho
          titulo={
            localizacao.pathname.startsWith('/ativos/')
              ? 'Acompanhamento de Ativo'
              : TITULOS_POR_ROTA[localizacao.pathname] ?? 'Dashboard Principal'
          }
          usuario={usuario}
        />
        <main className="dashboard-main">
          {erro && <Alerta variante="erro">{erro}</Alerta>}
          <motion.div
            className="dashboard-route-content"
            key={localizacao.pathname}
            initial={reduzirMovimento ? false : { y: 5 }}
            animate={{ y: 0 }}
            transition={{ duration: reduzirMovimento ? 0 : 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default LayoutPainel
