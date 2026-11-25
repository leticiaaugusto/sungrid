
import { Chamado, STATUS_CHAMADO } from '../chamados/Chamado.js'
import { FaixaOperacao } from './FaixaOperacao.js'
import { LIMITE_OFFLINE_SEGUNDOS } from './TelemetriaAtual.js'

// Esta constante reúne as opções usadas pela tela.

export const TIPOS_ATIVO = Object.freeze(['PAINEL', 'INVERSOR', 'MEDIDOR', 'BATERIA', 'SENSOR'])

// Esta constante disponibiliza STATUS_ATIVO para outras partes do projeto.

export const STATUS_ATIVO = Object.freeze({
  OPERANDO: 'OPERANDO',
  ALERTA: 'ALERTA',
  OFFLINE: 'OFFLINE',
  MANUTENCAO: 'MANUTENCAO',
})

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

  ehGerador() {
    return TIPOS_GERADORES.includes(this.tipo)
  }

  horasAteManutencao() {
    if (this.proximaManutencaoH === null || this.proximaManutencaoH === undefined) return null
    return this.proximaManutencaoH - this.horasOperacao
  }

  manutencaoVencida() {
    const restante = this.horasAteManutencao()
    return restante !== null && restante <= 0
  }

  estaOffline(telemetria, agora = new Date()) {
    if (!telemetria) return true
    return telemetria.segundosDesdeAtualizacao(agora) > LIMITE_OFFLINE_SEGUNDOS
  }

  motivoParaNaoReiniciar() {
    if (this.status === STATUS_ATIVO.MANUTENCAO) {
      return 'Ativo em manutenção não pode ser reiniciado remotamente.'
    }
    return null
  }

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
