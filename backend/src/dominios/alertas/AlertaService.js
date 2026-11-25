
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

function normalizarFiltro(valor, permitidos, nome) {
  if (!valor || ['todos', 'todas', 'all'].includes(String(valor).toLowerCase())) return null
  const normalizado = String(valor).toUpperCase()
  if (!permitidos.includes(normalizado)) {
    throw erros.requisicaoInvalida(`Filtro de ${nome} inválido: ${valor}.`, nome)
  }
  return normalizado
}

// Esta constante disponibiliza AlertaService para outras partes do projeto.

export const AlertaService = {

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

  async resolverAutomaticamenteSeNormalizou(tipo, ativoId, momento = new Date()) {
    if (!TIPOS_ALERTA[tipo].resolucaoAutomatica) return
    const alerta = await alertaRepositorio.buscarAtivoPorTipo(tipo, ativoId)
    if (!alerta) return
    alerta.resolver(null, momento)
    await alertaRepositorio.salvarResolucao(alerta)
  },

  async avaliarTelemetria(ativo, telemetria, configuracao, momento = new Date()) {
    const violadas = condicoesVioladas(ativo, telemetria)

    for (const tipo of ['TEMPERATURA_ELEVADA', 'PICO_TENSAO', 'BATERIA_BAIXA']) {
      if (violadas[tipo]) {
        await this.abrirSeNaoExistir({ tipo, ativoId: ativo.id, descricao: violadas[tipo], momento })
      } else {
        await this.resolverAutomaticamenteSeNormalizou(tipo, ativo.id, momento)
      }
    }

    await this.resolverAutomaticamenteSeNormalizou(tipoAlertaOffline(ativo), ativo.id, momento)

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

  async recalcularStatusDoAtivo(ativo) {
    if (ativo.status === STATUS_ATIVO.MANUTENCAO) return
    const alertasAtivos = await alertaRepositorio.contarAtivosDoAtivo(ativo.id)
    const novoStatus = alertasAtivos > 0 ? STATUS_ATIVO.ALERTA : STATUS_ATIVO.OPERANDO
    if (novoStatus !== ativo.status) {
      await ativoRepositorio.atualizarStatus(ativo.id, novoStatus)
      ativo.status = novoStatus
    }
  },

  async listar({ status, prioridade } = {}, usuarioId = null) {
    const filtros = {
      status: normalizarFiltro(status, Object.values(STATUS_ALERTA), 'status'),
      prioridade: normalizarFiltro(prioridade, Object.values(PRIORIDADES), 'prioridade'),
    }
    const alertas = await alertaRepositorio.listar({ ...filtros, usuarioId })

    return alertas.map((alerta) => alerta.paraResposta())
  },

  contarAtivos(usuarioId = null) {
    return alertaRepositorio.contarAtivos(usuarioId)
  },

  async resolverManualmente(alertaId, usuarioId, ip) {
    const alerta = await alertaRepositorio.buscarPorId(alertaId, usuarioId)
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
      const ativo = await ativoRepositorio.buscarPorId(alerta.ativoId, usuarioId)
      if (ativo) await this.recalcularStatusDoAtivo(ativo)
    }
    return alerta.paraResposta()
  },

  async exportar({ status, prioridade, formato = 'csv' }, usuarioId, ip) {
    formato = String(formato).toLowerCase()
    if (!exportadorAlertas.formatosSuportados.includes(formato)) {
      throw erros.requisicaoInvalida('Formato inválido. Use csv, pdf ou xlsx.', 'formato')
    }

    const alertas = await this.listar({ status, prioridade }, usuarioId)
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
