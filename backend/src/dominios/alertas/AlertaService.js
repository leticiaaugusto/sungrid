/**
 * AlertaService: geração, resolução, consulta e exportação de alertas.
 *
 * Regras atendidas: RN18, RN29–RN39 e RN41 (status do ativo).
 *
 * Quem chama:
 *  - o simulador, a cada atualização de telemetria (10 s) -> avaliarTelemetria
 *  - o job de offline, a cada minuto                      -> verificarAtivosOffline
 *  - as rotas da tela Gerenciamento de Alertas            -> listar / exportar / resolverManualmente
 */
import { erros } from '../../compartilhado/erros.js'
import { STATUS_ATIVO } from '../ativos/Ativo.js'
import { ativoRepositorio } from '../ativos/ativoRepositorio.js'
import { telemetriaRepositorio } from '../ativos/telemetriaRepositorio.js'
import { ACOES_AUDITADAS } from '../auditoria/Auditoria.js'
import { AuditoriaService } from '../auditoria/AuditoriaService.js'
import { TIPO_ATIVO_CONSUMO } from '../consumo/fontesDeEnergia.js'
import { Alerta, PRIORIDADES, STATUS_ALERTA } from './Alerta.js'
import { alertaRepositorio } from './alertaRepositorio.js'
import { exportadorAlertas } from './exportadorAlertas.js'
import { condicoesVioladas, TIPOS_ALERTA, tipoAlertaOffline } from './regrasAlerta.js'

/**
 * Aceita os valores da tela ("ativo", "alta", "todos"...) e devolve o valor
 * do banco ("ATIVO", "ALTA") ou null para "Todos/Todas" (RN31).
 */
function normalizarFiltro(valor, permitidos, nome) {
  if (!valor || ['todos', 'todas', 'all'].includes(String(valor).toLowerCase())) return null
  const normalizado = String(valor).toUpperCase()
  if (!permitidos.includes(normalizado)) {
    throw erros.requisicaoInvalida(`Filtro de ${nome} inválido: ${valor}.`, nome)
  }
  return normalizado
}

export const AlertaService = {
  /**
   * Cria o alerta se ainda não houver um ATIVO do mesmo tipo para o mesmo
   * ativo (RN35: evita duplicados enquanto a falha persiste).
   */
  async abrirSeNaoExistir({ tipo, ativoId = null, descricao, momento = new Date() }) {
    const existente = await alertaRepositorio.buscarAtivoPorTipo(tipo, ativoId)
    if (existente) return null

    const regra = TIPOS_ALERTA[tipo]
    return alertaRepositorio.inserir(
      new Alerta({
        ativoId,
        tipo,
        descricao,
        prioridade: regra.prioridade,
        status: STATUS_ALERTA.ATIVO,
        criadoEm: momento,
      }),
    )
  },

  /**
   * Resolução automática (RN37): só para tipos que permitem e quando a
   * condição já voltou ao normal. Fica registrada como ação do sistema.
   */
  async resolverAutomaticamenteSeNormalizou(tipo, ativoId, momento = new Date()) {
    if (!TIPOS_ALERTA[tipo].resolucaoAutomatica) return
    const alerta = await alertaRepositorio.buscarAtivoPorTipo(tipo, ativoId)
    if (!alerta) return
    alerta.resolver(null, momento)
    await alertaRepositorio.salvarResolucao(alerta)
  },

  /**
   * Avalia uma nova telemetria de um ativo (RN36). Chamado pelo simulador
   * a cada 10 s e também na geração do histórico (com `momento` no passado).
   *
   * @param {import('../ativos/Ativo.js').Ativo} ativo
   * @param {import('../ativos/TelemetriaAtual.js').TelemetriaAtual} telemetria
   * @param {import('../parametros/Configuracao.js').Configuracao} configuracao
   */
  async avaliarTelemetria(ativo, telemetria, configuracao, momento = new Date()) {
    const violadas = condicoesVioladas(ativo, telemetria)

    // Condições ligadas ao próprio equipamento.
    for (const tipo of ['TEMPERATURA_ELEVADA', 'PICO_TENSAO', 'BATERIA_BAIXA']) {
      if (violadas[tipo]) {
        await this.abrirSeNaoExistir({ tipo, ativoId: ativo.id, descricao: violadas[tipo], momento })
      } else {
        await this.resolverAutomaticamenteSeNormalizou(tipo, ativo.id, momento)
      }
    }

    // A telemetria chegou: se havia alerta de offline, a comunicação voltou.
    await this.resolverAutomaticamenteSeNormalizou(tipoAlertaOffline(ativo), ativo.id, momento)

    // Alerta da instalação inteira (sem ativo): consumo acima do limite operacional.
    if (ativo.tipo === TIPO_ATIVO_CONSUMO && configuracao.limiteOperacionalKw !== null) {
      if (telemetria.potenciaConsumidaKw > configuracao.limiteOperacionalKw) {
        await this.abrirSeNaoExistir({
          tipo: 'CONSUMO_ACIMA_LIMITE',
          descricao:
            `Consumo de ${telemetria.potenciaConsumidaKw.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kW ` +
            `acima do limite operacional de ${configuracao.limiteOperacionalKw.toLocaleString('pt-BR')} kW`,
          momento,
        })
      } else {
        await this.resolverAutomaticamenteSeNormalizou('CONSUMO_ACIMA_LIMITE', null, momento)
      }
    }

    await this.recalcularStatusDoAtivo(ativo)
  },

  /**
   * Job executado a cada minuto (RN36 / RNF17): ativos sem telemetria há
   * mais de 60 s ficam OFFLINE e geram alerta de falha de comunicação ou
   * de sensor offline.
   */
  async verificarAtivosOffline(agora = new Date()) {
    const [ativos, telemetrias] = await Promise.all([
      ativoRepositorio.listarTodos(),
      telemetriaRepositorio.listarTodas(),
    ])
    const telemetriaPorAtivo = new Map(telemetrias.map((telemetria) => [telemetria.ativoId, telemetria]))

    for (const ativo of ativos) {
      if (ativo.status === STATUS_ATIVO.MANUTENCAO) continue
      const telemetria = telemetriaPorAtivo.get(ativo.id)
      if (!ativo.estaOffline(telemetria, agora)) continue

      const segundos = telemetria ? telemetria.segundosDesdeAtualizacao(agora) : null
      await this.abrirSeNaoExistir({
        tipo: tipoAlertaOffline(ativo),
        ativoId: ativo.id,
        descricao: segundos
          ? `${ativo.codigo} sem telemetria há ${segundos} segundos`
          : `${ativo.codigo} nunca enviou telemetria`,
        momento: agora,
      })
      await ativoRepositorio.atualizarStatus(ativo.id, STATUS_ATIVO.OFFLINE)
    }
  },

  /**
   * Status do ativo (RN41) — DECISÃO (DP11):
   * MANUTENCAO é definido manualmente e não muda sozinho;
   * com alerta ativo -> ALERTA; sem alerta -> OPERANDO.
   * (OFFLINE é definido pelo job acima e sai daqui quando a telemetria volta.)
   */
  async recalcularStatusDoAtivo(ativo) {
    if (ativo.status === STATUS_ATIVO.MANUTENCAO) return
    const alertasAtivos = await alertaRepositorio.contarAtivosDoAtivo(ativo.id)
    const novoStatus = alertasAtivos > 0 ? STATUS_ATIVO.ALERTA : STATUS_ATIVO.OPERANDO
    if (novoStatus !== ativo.status) {
      await ativoRepositorio.atualizarStatus(ativo.id, novoStatus)
      ativo.status = novoStatus
    }
  },

  /** Lista da tela de alertas com filtros combinados (RF21–RF25). */
  async listar({ status, prioridade } = {}) {
    const filtros = {
      status: normalizarFiltro(status, Object.values(STATUS_ALERTA), 'status'),
      prioridade: normalizarFiltro(prioridade, Object.values(PRIORIDADES), 'prioridade'),
    }
    const alertas = await alertaRepositorio.listar(filtros)
    // RN32: lista vazia é uma resposta normal ([]), nada é alterado no banco.
    return alertas.map((alerta) => alerta.paraResposta())
  },

  /** Card "Alertas Ativos" do Dashboard (RN18). */
  contarAtivos() {
    return alertaRepositorio.contarAtivos()
  },

  /** Resolução manual por um usuário (RN37 / RN38). */
  async resolverManualmente(alertaId, usuarioId, ip) {
    const alerta = await alertaRepositorio.buscarPorId(alertaId)
    if (!alerta) throw erros.naoEncontrado('Alerta não encontrado.')
    if (alerta.status === STATUS_ALERTA.RESOLVIDO) throw erros.conflito('Este alerta já está resolvido.')

    alerta.resolver(usuarioId)
    await alertaRepositorio.salvarResolucao(alerta)
    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.ALERTA_RESOLVIDO,
      alvo: { entidade: 'alerta', id: alerta.id },
      ip,
    })

    if (alerta.ativoId) {
      const ativo = await ativoRepositorio.buscarPorId(alerta.ativoId)
      if (ativo) await this.recalcularStatusDoAtivo(ativo)
    }
    return alerta.paraResposta()
  },

  /**
   * Exportação do relatório (RF26 / RN39 / RNF21).
   * DECISÃO (DP10): exporta exatamente os alertas dos filtros aplicados.
   * Toda exportação fica registrada na auditoria.
   */
  async exportar({ status, prioridade, formato = 'csv' }, usuarioId, ip) {
    formato = String(formato).toLowerCase()
    if (!exportadorAlertas.formatosSuportados.includes(formato)) {
      throw erros.requisicaoInvalida('Formato inválido. Use csv, pdf ou xlsx.', 'formato')
    }

    const alertas = await this.listar({ status, prioridade })
    const arquivo = await exportadorAlertas.gerar(alertas, formato, { status, prioridade })

    await AuditoriaService.registrar({
      usuarioId,
      acao: ACOES_AUDITADAS.RELATORIO_EXPORTADO,
      alvo: { entidade: 'alerta', id: null },
      ip,
      detalhes: { formato, status: status ?? 'todos', prioridade: prioridade ?? 'todas', quantidade: alertas.length },
    })
    return arquivo
  },
}
