import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Alerta from '../../compartilhado/componentes/Alerta.jsx'
import Icone from '../../compartilhado/componentes/Icone.jsx'
import { diaDaSemana, formatarKw, formatarNumero, mensagemDeErro } from '../../compartilhado/utilitarios/formatacao.js'
import GraficoHistoricoAtivo from './GraficoHistoricoAtivo.jsx'
import { ativosServico } from './ativosServico.js'

const ATUALIZAR_TELEMETRIA_MS = 5_000

const ROTULOS_STATUS = {
  OPERANDO: 'Operando',
  ALERTA: 'Em alerta',
  OFFLINE: 'Offline',
  MANUTENCAO: 'Em manutenção',
}

const tomDaSituacao = (situacao) => (situacao === 'atencao' ? 'warning' : 'positive')
// Esta função organiza os dados antes de enviá-los ou exibí-los.

function montarMetricas(ativo, telemetria) {
  const { valores, avaliacao } = telemetria
  const gerador = telemetria.grandezaPrincipal === 'gerada'
  const potencia = gerador ? valores.potenciaGeradaKw : valores.potenciaConsumidaKw
  const metricas = []

  if (ativo.tipo === 'BATERIA') {
    const carregandoKw = valores.potenciaConsumidaKw ?? 0
    const descarregandoKw = valores.potenciaGeradaKw ?? 0
    const estado = carregandoKw > 0.05 ? 'Carregando' : descarregandoKw > 0.05 ? 'Descarregando' : 'Em espera'
    const potenciaEstado = carregandoKw > 0.05 ? carregandoKw : descarregandoKw
    metricas.push({
      id: 'bateria',
      rotulo: estado,
      valor: formatarKw(potenciaEstado),
      legenda: telemetria.desatualizada
        ? `Sem atualização há ${telemetria.segundosDesdeAtualizacao}s`
        : `Atualizado há ${telemetria.segundosDesdeAtualizacao}s`,
      tom: telemetria.desatualizada ? 'warning' : 'positive',
      icone: 'bateria',
    })
  } else {
    metricas.push({
      id: 'potencia',
      rotulo: gerador ? 'Potência Gerada' : 'Consumo Atual',
      valor: formatarKw(potencia),
      legenda: telemetria.desatualizada
        ? `Sem atualização há ${telemetria.segundosDesdeAtualizacao}s`
        : `Atualizado há ${telemetria.segundosDesdeAtualizacao}s`,
      tom: telemetria.desatualizada ? 'warning' : 'positive',
      icone: 'sol',
    })
  }

  if (valores.temperaturaC !== null) {
    metricas.push({
      id: 'temperatura',
      rotulo: 'Temperatura',
      valor: `${formatarNumero(valores.temperaturaC)}°C`,
      legenda: avaliacao.temperatura.texto,
      tom: tomDaSituacao(avaliacao.temperatura.situacao),
      icone: 'atividade',
    })
  }

  if (valores.tensaoV !== null) {
    metricas.push({
      id: 'tensao',
      rotulo: 'Tensão',
      valor: `${formatarNumero(valores.tensaoV)} V`,
      legenda: avaliacao.tensao.texto,
      tom: tomDaSituacao(avaliacao.tensao.situacao),
      icone: 'atividade',
    })
  }

  if (valores.correnteA !== null) {
    metricas.push({
      id: 'corrente',
      rotulo: 'Corrente',
      valor: `${formatarNumero(valores.correnteA)} A`,
      legenda: avaliacao.corrente.texto,
      tom: tomDaSituacao(avaliacao.corrente.situacao),
      icone: 'atividade',
    })
  }

  if (valores.cargaPct !== null) {
    metricas.push({
      id: 'carga',
      rotulo: 'Carga da Bateria',
      valor: `${formatarNumero(valores.cargaPct)}%`,
      legenda: valores.cargaPct < 20 ? 'Carga abaixo do mínimo' : 'Carga adequada',
      tom: valores.cargaPct < 20 ? 'warning' : 'positive',
      icone: 'bateria',
    })
  }

  if (valores.eficienciaPct !== null) {
    metricas.push({
      id: 'eficiencia',
      rotulo: 'Eficiência',
      valor: `${formatarNumero(valores.eficienciaPct)}%`,
      legenda: avaliacao.eficiencia.texto,
      tom: tomDaSituacao(avaliacao.eficiencia.situacao),
      icone: 'sol',
    })
  }

  const restante = ativo.horasAteManutencao
  metricas.push({
    id: 'horas-operacao',
    rotulo: 'Horas de Operação',
    valor: `${formatarNumero(ativo.horasOperacao, 0)}h`,
    legenda:
      restante === null
        ? 'Sem manutenção programada'
        : ativo.manutencaoVencida
          ? `Manutenção vencida há ${formatarNumero(Math.abs(restante), 0)}h`
          : `Próxima manutenção em ${formatarNumero(restante, 0)}h`,
    tom: ativo.manutencaoVencida || (restante !== null && restante < 720) ? 'warning' : 'positive',
    icone: 'atividade',
  })

  return metricas
}
// Esta tela monta a página AcompanhamentoAtivo.

function PaginaAcompanhamentoAtivo() {
  const { id: idAtivo } = useParams()
  const [tentativa, setTentativa] = useState(0)

  const chave = `${idAtivo}:${tentativa}`
  const [cadastro, setCadastro] = useState({ chave: '', ativo: null, historico: null, erro: '' })
  const [telemetria, setTelemetria] = useState({ idAtivo: null, dados: null })
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [retornoAcao, setRetornoAcao] = useState({ idAtivo: null, mensagem: '', erro: '' })
  const [acaoPendente, setAcaoPendente] = useState('')

  const buscarCadastroEHistorico = useCallback(
    () => Promise.all([ativosServico.detalhar(idAtivo), ativosServico.historico(idAtivo)]),
    [idAtivo],
  )

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    if (!idAtivo) return undefined
    let naTela = true
    buscarCadastroEHistorico()
      .then(([ativo, historico]) => naTela && setCadastro({ chave, ativo, historico, erro: '' }))
      .catch(
        (falha) =>
          naTela &&
          setCadastro({ chave, ativo: null, historico: null, erro: mensagemDeErro(falha, 'Não foi possível carregar os dados do ativo.') }),
      )
    return () => {
      naTela = false
    }
  }, [chave, idAtivo, buscarCadastroEHistorico])

  // Este efeito atualiza a tela quando necessário.

  useEffect(() => {
    if (!idAtivo) return undefined
    let naTela = true
    const atualizar = () =>
      ativosServico
        .telemetria(idAtivo)
        .then((dados) => {
          if (!naTela) return
          setTelemetria({ idAtivo, dados })
          setAtualizadoEm(new Date())
        })
        .catch(() => {})
    atualizar()
    const intervalo = window.setInterval(atualizar, ATUALIZAR_TELEMETRIA_MS)
    return () => {
      naTela = false
      window.clearInterval(intervalo)
    }
  }, [idAtivo, tentativa])

  const carregando = idAtivo && cadastro.chave !== chave
  const ativo = carregando ? null : cadastro.ativo
  const historico = carregando ? null : cadastro.historico
  const telemetriaAtual = telemetria.idAtivo === idAtivo ? telemetria.dados : null
  const retorno = retornoAcao.idAtivo === idAtivo ? retornoAcao : { mensagem: '', erro: '' }
  const erro = (carregando ? '' : cadastro.erro) || retorno.erro

  async function executarReinicio() {
    setAcaoPendente('reiniciar')
    setRetornoAcao({ idAtivo, mensagem: '', erro: '' })
    try {
      const resposta = await ativosServico.reiniciar(ativo.id)
      setRetornoAcao({ idAtivo, mensagem: resposta.mensagem, erro: '' })

      const [novoAtivo, novoHistorico] = await buscarCadastroEHistorico()
      setCadastro({ chave, ativo: novoAtivo, historico: novoHistorico, erro: '' })
    } catch (falha) {
      setRetornoAcao({ idAtivo, mensagem: '', erro: mensagemDeErro(falha, 'Não foi possível concluir a ação para este ativo.') })
    } finally {
      setAcaoPendente('')
    }
  }

  function confirmarReinicio() {

    if (window.confirm(`Confirma o reinício do ativo ${ativo.codigo}?`)) executarReinicio()
  }

  if (!ativo) {
    return erro ? (
      <>
        <Alerta variante="erro">{erro}</Alerta>
        <button className="alerts-export-button asset-retry-button" onClick={() => setTentativa((valor) => valor + 1)} type="button">
          Tentar novamente
        </button>
      </>
    ) : (
      <div className="dashboard-loading" role="status">
        Carregando dados do ativo...
      </div>
    )
  }

  const metricas = telemetriaAtual?.disponivel ? montarMetricas(ativo, telemetriaAtual) : []
  const gerador = ativo.tipo === 'PAINEL' || ativo.tipo === 'INVERSOR'

  return (
    <section className="asset-page" aria-label="Acompanhamento de ativo">
      <p className="demo-data-note">
        Dados simulados (loja de demonstração)
        {atualizadoEm && ` · Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR')}`}
      </p>
      <Link className="asset-back-link" to="/ativos">Voltar para a lista</Link>

      {erro && <Alerta variante="erro">{erro}</Alerta>}
      {retorno.mensagem && <Alerta>{retorno.mensagem}</Alerta>}

      <section className="asset-summary" aria-label="Ativo selecionado">
        <div className="asset-summary__identity">
          <div className="asset-summary__title">
            <h2>{ativo.nome}</h2>
            <span className={`asset-status asset-status--${ativo.status.toLowerCase()}`}>
              {ROTULOS_STATUS[ativo.status] ?? ativo.status}
            </span>
          </div>
          <p>
            ID do Ativo: #{ativo.codigo}
            {ativo.fabricante && (
              <>
                <span aria-hidden="true"> | </span>
                Fabricante: {ativo.fabricante}
              </>
            )}
          </p>
        </div>
        <div className="asset-summary__actions">
          <button
            className="asset-action-button asset-action-button--secondary"
            disabled={Boolean(acaoPendente)}
            onClick={confirmarReinicio}
            type="button"
          >
            {acaoPendente === 'reiniciar' ? 'Reiniciando...' : 'Reiniciar Ativo'}
          </button>
        </div>
      </section>

      {telemetriaAtual && !telemetriaAtual.disponivel && <Alerta variante="erro">{telemetriaAtual.mensagem}</Alerta>}

      <section className="asset-metrics-grid" aria-label="Métricas do ativo">
        {metricas.map((metrica) => (
          <article className={`asset-metric-card asset-metric-card--${metrica.id}`} key={metrica.id}>
            <div className="asset-metric-card__heading">
              <h3>{metrica.rotulo}</h3>
              <span className={`asset-metric-card__icon asset-metric-card__icon--${metrica.tom}`}>
                <Icone nome={metrica.icone} tamanho={16} />
              </span>
            </div>
            <p className="asset-metric-card__value">{metrica.valor}</p>
            <p className={`asset-metric-card__caption asset-metric-card__caption--${metrica.tom}`}>
              <Icone nome={metrica.tom === 'warning' ? 'alerta' : 'setaCima'} tamanho={12} />
              <span>{metrica.legenda}</span>
            </p>
          </article>
        ))}
      </section>

      {historico && (
        <GraficoHistoricoAtivo
          dados={{
            titulo: 'Histórico de Potência do Ativo (7 dias)',
            descricao: gerador
              ? 'Potência média gerada por dia por este equipamento'
              : 'Potência média consumida por dia por este equipamento',
            legenda: gerador ? 'Potência gerada' : 'Potência consumida',
            rotulos: historico.dias.map((dia) => diaDaSemana(dia.data)),
            potenciaKw: historico.dias.map((dia) => dia.potenciaMediaKw),
          }}
        />
      )}
    </section>
  )
}

export default PaginaAcompanhamentoAtivo
