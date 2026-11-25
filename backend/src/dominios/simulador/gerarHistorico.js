
import { consultar, emTransacao, pool } from '../../config/banco.js'
import { Alerta, STATUS_ALERTA } from '../alertas/Alerta.js'
import { AlertaService } from '../alertas/AlertaService.js'
import { condicoesVioladas, TIPOS_ALERTA } from '../alertas/regrasAlerta.js'
import { ativoRepositorio } from '../ativos/ativoRepositorio.js'
import { Leitura } from '../ativos/Leitura.js'
import { leituraRepositorio } from '../ativos/leituraRepositorio.js'
import { TelemetriaAtual } from '../ativos/TelemetriaAtual.js'
import { telemetriaRepositorio } from '../ativos/telemetriaRepositorio.js'
import { TIPO_ATIVO_CONSUMO } from '../consumo/fontesDeEnergia.js'
import { parametrosRepositorio } from '../parametros/parametrosRepositorio.js'
import { usuarioRepositorio } from '../autenticacao/usuarioRepositorio.js'
import { proximaCargaBateria, valoresDosAtivos } from './perfilLoja.js'

const MINUTOS_POR_LEITURA = 15
const AMOSTRAS_POR_BLOCO = 3

const MINUTOS_PARA_OPERADOR_RESOLVER = 50

function lerArgumentos() {
  const argumentos = process.argv.slice(2)
  const dias = Number(argumentos.find((arg) => arg.startsWith('--dias='))?.split('=')[1] ?? 60)
  return { dias: Math.min(Math.max(dias, 1), 120), limpar: argumentos.includes('--limpar') }
}

const arredondar3 = (valor) => (typeof valor === 'number' ? Math.round(valor * 1000) / 1000 : valor)

async function principal() {
  const { dias, limpar } = lerArgumentos()

  const usuarioSimulador = await usuarioRepositorio.buscarPorEmail('simulador@sungrid.local')
  const ativos = await ativoRepositorio.listarTodos(usuarioSimulador?.id)
  if (ativos.length === 0) {
    throw new Error('Nenhum ativo cadastrado. Rode antes o arquivo banco/03_dados_iniciais.sql.')
  }
  const configuracao = await parametrosRepositorio.buscarConfiguracao()

  if (limpar) {
    console.info('Apagando leituras, alertas e telemetria atuais...')
    await emTransacao(async (cliente) => {
      await cliente.query('DELETE FROM leitura')
      await cliente.query('DELETE FROM alerta')
      await cliente.query('DELETE FROM telemetria_atual')
      await cliente.query("UPDATE ativo SET horas_operacao = 0, status = 'OPERANDO' WHERE status <> 'MANUTENCAO'")
    })
  } else if ((await leituraRepositorio.contar()) > 0) {
    throw new Error('Já existem leituras no banco. Para gerar de novo, use: npm run simulador:historico -- --limpar')
  }

  const { rows: usuarios } = await consultar(
    "SELECT id FROM usuario WHERE papel <> 'SISTEMA' ORDER BY (papel = 'ADMINISTRADOR') DESC, id LIMIT 1",
  )
  const operadorId = usuarios[0]?.id ?? null

  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  inicio.setDate(inicio.getDate() - dias)
  const fim = new Date()
  fim.setSeconds(0, 0)
  fim.setMinutes(Math.floor(fim.getMinutes() / MINUTOS_POR_LEITURA) * MINUTOS_POR_LEITURA)

  console.info(`Gerando histórico de ${inicio.toLocaleString('pt-BR')} até ${fim.toLocaleString('pt-BR')}...`)

  let cargaBateria = 60
  const agoraInicial = new Date()
  const horasOperacao = new Map(
    ativos.map((ativo) => {
      const instalado = ativo.instaladoEm ? new Date(`${ativo.instaladoEm}T00:00:00`) : null
      if (!instalado || Number.isNaN(instalado.getTime())) return [ativo.id, 0]
      const dias = Math.max(0, Math.floor((agoraInicial.getTime() - instalado.getTime()) / 86_400_000))
      const horasPorDia = ['PAINEL', 'INVERSOR'].includes(ativo.tipo) ? 11 : 24
      return [ativo.id, dias * horasPorDia]
    }),
  )
  const alertasAbertos = new Map()
  const alertasGerados = []
  let leiturasDoDia = []
  let totalLeituras = 0
  let ultimosValores = new Map()

  const abrir = (tipo, ativoId, descricao, momento) => {
    const chave = `${tipo}:${ativoId ?? 'instalacao'}`
    if (alertasAbertos.has(chave)) return
    const alerta = new Alerta({
      ativoId,
      tipo,
      descricao,
      prioridade: TIPOS_ALERTA[tipo].prioridade,
      status: STATUS_ALERTA.ATIVO,
      criadoEm: new Date(momento),
    })
    alertasAbertos.set(chave, alerta)
    alertasGerados.push(alerta)
  }

  const normalizou = (tipo, ativoId, momento) => {
    const chave = `${tipo}:${ativoId ?? 'instalacao'}`
    const alerta = alertasAbertos.get(chave)
    if (!alerta) return
    if (TIPOS_ALERTA[tipo].resolucaoAutomatica) {
      alerta.resolver(null, new Date(momento))
      alertasAbertos.delete(chave)
    } else if (operadorId && momento - alerta.criadoEm >= MINUTOS_PARA_OPERADOR_RESOLVER * 60_000) {
      alerta.resolver(operadorId, new Date(momento))
      alertasAbertos.delete(chave)
    }
  }

  for (
    let fimDoBloco = new Date(inicio.getTime() + MINUTOS_POR_LEITURA * 60_000);
    fimDoBloco <= fim;
    fimDoBloco = new Date(fimDoBloco.getTime() + MINUTOS_POR_LEITURA * 60_000)
  ) {

    const somaGerada = new Map()
    const somaConsumida = new Map()
    let valores
    for (let amostra = 1; amostra <= AMOSTRAS_POR_BLOCO; amostra += 1) {
      const momento = new Date(fimDoBloco.getTime() - (MINUTOS_POR_LEITURA * 60_000 * (AMOSTRAS_POR_BLOCO - amostra)) / AMOSTRAS_POR_BLOCO)
      valores = valoresDosAtivos(momento, ativos, { cargaBateriaPct: cargaBateria })
      for (const ativo of ativos) {
        const valor = valores.get(ativo.id)
        somaGerada.set(ativo.id, (somaGerada.get(ativo.id) ?? 0) + (valor.potenciaGeradaKw ?? 0))
        somaConsumida.set(ativo.id, (somaConsumida.get(ativo.id) ?? 0) + (valor.potenciaConsumidaKw ?? 0))
        if (ativo.tipo === 'BATERIA') {
          cargaBateria = proximaCargaBateria(cargaBateria, valor, MINUTOS_POR_LEITURA / 60 / AMOSTRAS_POR_BLOCO)
        }
      }
    }

    for (const ativo of ativos) {
      const valor = valores.get(ativo.id)
      const horas = MINUTOS_POR_LEITURA / 60
      const energiaGerada = valor.potenciaGeradaKw === null ? null : (somaGerada.get(ativo.id) / AMOSTRAS_POR_BLOCO) * horas
      const energiaConsumida =
        valor.potenciaConsumidaKw === null ? null : (somaConsumida.get(ativo.id) / AMOSTRAS_POR_BLOCO) * horas

      leiturasDoDia.push(
        new Leitura({
          ativoId: ativo.id,
          dataHora: new Date(fimDoBloco),
          ...Object.fromEntries(Object.entries(valor).map(([chave, numero]) => [chave, arredondar3(numero)])),
          energiaGeradaKwh: arredondar3(energiaGerada),
          energiaConsumidaKwh: arredondar3(energiaConsumida),
        }),
      )

      if (!ativo.ehGerador() || (energiaGerada ?? 0) > 0.01) {
        horasOperacao.set(ativo.id, horasOperacao.get(ativo.id) + horas)
      }

      const telemetria = new TelemetriaAtual({ ativoId: ativo.id, atualizadoEm: fimDoBloco, ...valor })
      const violadas = condicoesVioladas(ativo, telemetria)
      for (const tipo of ['TEMPERATURA_ELEVADA', 'PICO_TENSAO', 'BATERIA_BAIXA']) {
        if (violadas[tipo]) abrir(tipo, ativo.id, violadas[tipo], fimDoBloco.getTime())
        else normalizou(tipo, ativo.id, fimDoBloco.getTime())
      }
      if (ativo.tipo === TIPO_ATIVO_CONSUMO && configuracao.limiteOperacionalKw !== null) {
        if (valor.potenciaConsumidaKw > configuracao.limiteOperacionalKw) {
          abrir(
            'CONSUMO_ACIMA_LIMITE',
            null,
            `Consumo de ${valor.potenciaConsumidaKw.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kW ` +
              `acima do limite operacional de ${configuracao.limiteOperacionalKw.toLocaleString('pt-BR')} kW`,
            fimDoBloco.getTime(),
          )
        } else {
          normalizou('CONSUMO_ACIMA_LIMITE', null, fimDoBloco.getTime())
        }
      }
    }
    ultimosValores = valores

    if (fimDoBloco.getHours() === 0 && fimDoBloco.getMinutes() === 0) {
      await leituraRepositorio.inserirVarias(leiturasDoDia)
      totalLeituras += leiturasDoDia.length
      process.stdout.write(`  dia ${fimDoBloco.toLocaleDateString('pt-BR')} gravado (${totalLeituras} leituras)\r`)
      leiturasDoDia = []
    }
  }
  await leituraRepositorio.inserirVarias(leiturasDoDia)
  totalLeituras += leiturasDoDia.length

  for (let i = 0; i < alertasGerados.length; i += 200) {
    const lote = alertasGerados.slice(i, i + 200)
    const parametros = []
    const linhas = lote.map((alerta, indice) => {
      parametros.push(
        alerta.ativoId,
        alerta.tipo,
        alerta.descricao,
        alerta.prioridade,
        alerta.status,
        alerta.criadoEm,
        alerta.resolvidoEm,
        alerta.resolvidoPor,
      )
      const base = indice * 8
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
    })
    await consultar(
      `INSERT INTO alerta (ativo_id, tipo, descricao, prioridade, status, criado_em, resolvido_em, resolvido_por)
       VALUES ${linhas.join(', ')}`,
      parametros,
    )
  }

  for (const ativo of ativos) {
    await ativoRepositorio.somarHorasOperacao(ativo.id, horasOperacao.get(ativo.id))
    const valor = ultimosValores.get(ativo.id)
    const telemetria = new TelemetriaAtual({ ativoId: ativo.id, atualizadoEm: new Date(), ...valor })
    for (const [chave, numero] of Object.entries(telemetria)) {
      if (typeof numero === 'number' && chave !== 'ativoId') telemetria[chave] = arredondar3(numero)
    }
    await telemetriaRepositorio.salvar(telemetria)
    await AlertaService.recalcularStatusDoAtivo(ativo)
  }

  const ativosAinda = alertasGerados.filter((alerta) => alerta.status === STATUS_ALERTA.ATIVO).length
  console.info(
    `\nPronto! ${totalLeituras} leituras e ${alertasGerados.length} alertas (${ativosAinda} ainda ativos) gerados para ${ativos.length} ativos.`,
  )
  if (!operadorId) {
    console.info('Obs.: nenhum usuário cadastrado, então alertas de pico de tensão do histórico ficaram ativos.')
  }
}

principal()
  .catch((erro) => {
    console.error(`\nErro ao gerar histórico: ${erro.message}`)
    process.exitCode = 1
  })
  .finally(() => pool.end())
