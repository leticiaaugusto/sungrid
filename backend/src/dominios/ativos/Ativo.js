/**
 * Entidade Ativo (tabela `ativo`) — RN11, RN40, RN41, RN44, RN47, RN48.
 *
 * Painéis, inversores, medidores, baterias e sensores da instalação.
 * A FaixaOperacao é uma COMPOSIÇÃO: existe só dentro do ativo.
 */
import { Chamado, STATUS_CHAMADO } from '../chamados/Chamado.js'
import { FaixaOperacao } from './FaixaOperacao.js'
import { LIMITE_OFFLINE_SEGUNDOS } from './TelemetriaAtual.js'

export const TIPOS_ATIVO = Object.freeze(['PAINEL', 'INVERSOR', 'MEDIDOR', 'BATERIA', 'SENSOR'])

export const STATUS_ATIVO = Object.freeze({
  OPERANDO: 'OPERANDO',
  ALERTA: 'ALERTA',
  OFFLINE: 'OFFLINE',
  MANUTENCAO: 'MANUTENCAO',
})

/** Tipos cuja grandeza principal é a potência GERADA (os demais: consumida). */
const TIPOS_GERADORES = ['PAINEL', 'INVERSOR']

export class Ativo {
  constructor(dados) {
    this.id = dados.id
    this.codigo = dados.codigo
    this.nome = dados.nome
    this.tipo = dados.tipo
    this.fabricante = dados.fabricante
    this.status = dados.status
    this.horasOperacao = dados.horasOperacao
    this.proximaManutencaoH = dados.proximaManutencaoH
    this.instaladoEm = dados.instaladoEm
    this.faixa = dados.faixa
  }

  static deLinha(linha) {
    if (!linha) return null
    return new Ativo({
      id: linha.id,
      codigo: linha.codigo,
      nome: linha.nome,
      tipo: linha.tipo,
      fabricante: linha.fabricante,
      status: linha.status,
      horasOperacao: linha.horas_operacao,
      proximaManutencaoH: linha.proxima_manutencao_h,
      instaladoEm: linha.instalado_em,
      faixa: new FaixaOperacao({
        temperaturaMaxC: linha.temperatura_max_c,
        tensaoNominalV: linha.tensao_nominal_v,
        toleranciaTensaoPct: linha.tolerancia_tensao_pct,
        correnteMaxA: linha.corrente_max_a,
        eficienciaMinPct: linha.eficiencia_min_pct,
      }),
    })
  }

  /** O ativo gera energia (painel/inversor) ou consome (medidor, bateria, sensor)? */
  ehGerador() {
    return TIPOS_GERADORES.includes(this.tipo)
  }

  /**
   * Horas restantes até a próxima manutenção (card "Horas de Operação" — RN44).
   * DECISÃO (DP11): `proxima_manutencao_h` é um MARCO ABSOLUTO de horas de
   * operação (ex.: manutenção ao atingir 5.000 h). Valor negativo = vencida.
   */
  horasAteManutencao() {
    if (this.proximaManutencaoH === null || this.proximaManutencaoH === undefined) return null
    return this.proximaManutencaoH - this.horasOperacao
  }

  manutencaoVencida() {
    const restante = this.horasAteManutencao()
    return restante !== null && restante <= 0
  }

  /** Sem telemetria recente = offline (método estaOffline do diagrama). */
  estaOffline(telemetria, agora = new Date()) {
    if (!telemetria) return true
    return telemetria.segundosDesdeAtualizacao(agora) > LIMITE_OFFLINE_SEGUNDOS
  }

  /**
   * Verifica se o reinício remoto pode ser executado (RN47).
   * DECISÃO (DP12): ativo em MANUTENÇÃO não pode ser reiniciado remotamente,
   * porque pode haver alguém trabalhando no equipamento.
   * @returns {string|null} motivo da recusa, ou null se permitido
   */
  motivoParaNaoReiniciar() {
    if (this.status === STATUS_ATIVO.MANUTENCAO) {
      return 'Ativo em manutenção não pode ser reiniciado remotamente.'
    }
    return null
  }

  /** Cria o chamado do botão "Solucionar Chamado" (RN48). */
  abrirChamado(usuarioId, descricao, alertaId = null) {
    return new Chamado({
      ativoId: this.id,
      alertaId,
      abertoPor: usuarioId,
      descricao,
      status: STATUS_CHAMADO.ABERTO,
      abertoEm: new Date(),
      resolvidoEm: null,
    })
  }

  /** Dados para a resposta da API. */
  paraResposta() {
    return {
      id: this.id,
      codigo: this.codigo,
      nome: this.nome,
      tipo: this.tipo,
      fabricante: this.fabricante,
      status: this.status,
      horasOperacao: Math.round(this.horasOperacao),
      proximaManutencaoH: this.proximaManutencaoH,
      horasAteManutencao: this.horasAteManutencao() === null ? null : Math.round(this.horasAteManutencao()),
      manutencaoVencida: this.manutencaoVencida(),
      instaladoEm: this.instaladoEm,
      faixaOperacao: { ...this.faixa },
    }
  }
}
