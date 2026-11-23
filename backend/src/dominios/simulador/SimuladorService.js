/**
 * SimuladorService: gera os dados da loja em tempo real (seção 2.2 do relatório).
 *
 * Como o projeto não tem sensores físicos, este serviço faz o papel dos
 * medidores, no MESMO formato que um equipamento real produziria:
 *
 *  - a cada intervalo configurado: sobrescreve a telemetria_atual de cada ativo e
 *    pede ao AlertaService que avalie os novos valores (RNF07 / RN36);
 *  - no intervalo configurado (padrão 15 minutos): grava uma linha na tabela
 *    `leitura` por ativo, com potência instantânea e energia do intervalo.
 *
 * Os dois intervalos têm finalidades diferentes e não se misturam:
 * telemetria = "agora"; leitura = histórico usado nos totais.
 *
 * Para trocar o simulador por sensores reais (RNF20), basta outra fonte
 * gravar nas mesmas tabelas e chamar o mesmo AlertaService.
 */
import { AlertaService } from '../alertas/AlertaService.js'
import { ativoRepositorio } from '../ativos/ativoRepositorio.js'
import { Leitura } from '../ativos/Leitura.js'
import { leituraRepositorio } from '../ativos/leituraRepositorio.js'
import { TelemetriaAtual } from '../ativos/TelemetriaAtual.js'
import { telemetriaRepositorio } from '../ativos/telemetriaRepositorio.js'
import { parametrosRepositorio } from '../parametros/parametrosRepositorio.js'
import { controleSimulacao } from './controleSimulacao.js'
import { chaveDoDia, proximaCargaBateria, valoresDosAtivos } from './perfilLoja.js'
import { ambiente } from '../../config/ambiente.js'

const INTERVALO_TELEMETRIA_MS = ambiente.simuladorTelemetriaSeg * 1000
const INTERVALO_LEITURA_MIN = ambiente.simuladorLeituraMin
const RECARREGAR_CADASTRO_MS = 60_000

/** Chance por ciclo, ajustada ao intervalo, de o sensor cair (~1 vez a cada 3 horas). */
const CHANCE_SENSOR_CAIR = ambiente.simuladorTelemetriaSeg / (3 * 3600)
const DURACAO_SENSOR_FORA_MS = 150_000

const estado = {
  temporizador: null,
  ativos: [],
  configuracao: null,
  ultimaRecarga: 0,
  cargaBateriaPct: 60,
  ultimoTick: null,
  diaAtual: null,
  sensorForaAte: new Map(),
  /** ativoId -> amostras de 10 s do intervalo de 15 min em andamento */
  amostras: new Map(),
  inicioDoIntervalo: null,
  executando: false,
}

/** Início do bloco de 15 min que contém o momento (ex.: 10:37 -> 10:30). */
function inicioDoBloco(momento) {
  const inicio = new Date(momento)
  inicio.setSeconds(0, 0)
  inicio.setMinutes(Math.floor(inicio.getMinutes() / INTERVALO_LEITURA_MIN) * INTERVALO_LEITURA_MIN)
  return inicio
}

const media = (lista) => (lista.length ? lista.reduce((soma, valor) => soma + valor, 0) / lista.length : null)

async function recarregarCadastro(agora) {
  if (agora - estado.ultimaRecarga < RECARREGAR_CADASTRO_MS && estado.ativos.length) return
  ;[estado.ativos, estado.configuracao] = await Promise.all([
    ativoRepositorio.listarTodos(),
    parametrosRepositorio.buscarConfiguracao(),
  ])
  estado.ultimaRecarga = agora.getTime()
}

/** Sensor offline de vez em quando, para demonstrar o alerta (RF27). */
function sensorEstaFora(ativo, agora) {
  if (ativo.tipo !== 'SENSOR') return false
  const ate = estado.sensorForaAte.get(ativo.id)
  if (ate && agora.getTime() < ate) return true
  if (Math.random() < CHANCE_SENSOR_CAIR) {
    estado.sensorForaAte.set(ativo.id, agora.getTime() + DURACAO_SENSOR_FORA_MS)
    console.info(`[simulador] ${ativo.codigo} ficou sem comunicação (simulação de falha).`)
    return true
  }
  return false
}

/**
 * Fecha o bloco de 15 min: grava uma leitura por ativo com
 * energia = potência média do bloco x 0,25 h (RN15).
 */
async function gravarLeiturasDoBloco(fimDoBloco) {
  const leituras = []
  for (const ativo of estado.ativos) {
    const amostras = estado.amostras.get(ativo.id) ?? []
    if (amostras.length === 0) continue // sem dados no bloco = sem leitura (não é zero)
    const ultima = amostras.at(-1)
    const mediaGerada = media(amostras.map((amostra) => amostra.potenciaGeradaKw).filter((valor) => valor !== null))
    const mediaConsumida = media(amostras.map((amostra) => amostra.potenciaConsumidaKw).filter((valor) => valor !== null))
    const horas = INTERVALO_LEITURA_MIN / 60

    leituras.push(
      new Leitura({
        ativoId: ativo.id,
        dataHora: fimDoBloco,
        potenciaGeradaKw: ultima.potenciaGeradaKw,
        potenciaConsumidaKw: ultima.potenciaConsumidaKw,
        energiaGeradaKwh: mediaGerada === null ? null : mediaGerada * horas,
        energiaConsumidaKwh: mediaConsumida === null ? null : mediaConsumida * horas,
        temperaturaC: ultima.temperaturaC,
        tensaoV: ultima.tensaoV,
        correnteA: ultima.correnteA,
        eficienciaPct: ultima.eficienciaPct,
        cargaPct: ultima.cargaPct,
      }),
    )

    // Horas de operação: geradores só contam enquanto produzem; os demais, sempre.
    const operando = ativo.ehGerador() ? (mediaGerada ?? 0) > 0.05 : true
    if (operando) await ativoRepositorio.somarHorasOperacao(ativo.id, horas)
  }
  await leituraRepositorio.inserirVarias(leituras.map(arredondarLeitura))
  estado.amostras.clear()
}

/** Guarda no banco com 3 casas decimais (o suficiente para kW/kWh). */
function arredondarLeitura(leitura) {
  for (const [chave, valor] of Object.entries(leitura)) {
    if (typeof valor === 'number' && chave !== 'ativoId') leitura[chave] = Math.round(valor * 1000) / 1000
  }
  return leitura
}

/** Um ciclo de 10 s. */
async function tick() {
  if (estado.executando) return // o ciclo anterior ainda não terminou
  estado.executando = true
  const agora = new Date()

  try {
    await recarregarCadastro(agora)

    // Virada de dia: reinícios do dia anterior deixam de valer.
    const dia = chaveDoDia(agora)
    if (estado.diaAtual && estado.diaAtual !== dia) controleSimulacao.limparReinicios()
    estado.diaAtual = dia

    // Fechou um bloco de 15 min? Grava as leituras dele antes de começar o próximo.
    const bloco = inicioDoBloco(agora)
    if (estado.inicioDoIntervalo && bloco.getTime() !== estado.inicioDoIntervalo.getTime()) {
      await gravarLeiturasDoBloco(bloco)
    }
    estado.inicioDoIntervalo = bloco

    // Bateria evolui conforme o tempo que passou desde o último ciclo.
    const horasDesdeUltimo = estado.ultimoTick ? (agora - estado.ultimoTick) / 3_600_000 : 0
    estado.ultimoTick = agora

    const valores = valoresDosAtivos(agora, estado.ativos, {
      cargaBateriaPct: estado.cargaBateriaPct,
      reiniciando: (id) => controleSimulacao.estaReiniciando(id),
      semFalhas: (id) => controleSimulacao.foiReiniciado(id),
    })

    for (const ativo of estado.ativos) {
      const valor = valores.get(ativo.id)
      if (!valor) continue
      if (ativo.tipo === 'BATERIA') {
        estado.cargaBateriaPct = proximaCargaBateria(estado.cargaBateriaPct, valor, horasDesdeUltimo)
      }
      if (sensorEstaFora(ativo, agora)) continue

      // RNF18: erro em um equipamento não derruba os outros.
      try {
        const telemetria = arredondarLeitura(new TelemetriaAtual({ ativoId: ativo.id, atualizadoEm: agora, ...valor }))
        await telemetriaRepositorio.salvar(telemetria)
        await AlertaService.avaliarTelemetria(ativo, telemetria, estado.configuracao, agora)

        const amostras = estado.amostras.get(ativo.id) ?? []
        amostras.push(valor)
        estado.amostras.set(ativo.id, amostras)
      } catch (erro) {
        console.error(`[simulador] falha ao processar ${ativo.codigo}:`, erro.message)
      }
    }
  } catch (erro) {
    console.error('[simulador] erro no ciclo:', erro.message)
  } finally {
    estado.executando = false
  }
}

export const SimuladorService = {
  async iniciar() {
    if (estado.temporizador) return
    estado.cargaBateriaPct = (await leituraRepositorio.ultimaCargaBateria()) ?? 60
    controleSimulacao.marcarEmExecucao(true)
    await tick()
    estado.temporizador = setInterval(tick, INTERVALO_TELEMETRIA_MS)
    console.info(
      `[simulador] loja simulada em execução: telemetria a cada ${ambiente.simuladorTelemetriaSeg} s, leituras a cada ${ambiente.simuladorLeituraMin} min (${estado.ativos.length} ativos).`,
    )
  },

  parar() {
    clearInterval(estado.temporizador)
    estado.temporizador = null
    controleSimulacao.marcarEmExecucao(false)
  },
}
