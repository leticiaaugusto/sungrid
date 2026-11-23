/**
 * Perfil de 24 horas de uma LOJA com geração solar própria.
 *
 * Este arquivo só contém matemática: dado um horário, calcula quanto o
 * sol está gerando, quanto a loja está consumindo e os valores de cada
 * equipamento. Não acessa banco. É usado tanto pelo simulador em tempo
 * real quanto pela geração do histórico, por isso os dois são coerentes.
 *
 * A loja simulada:
 *  - Segunda a sábado: aberta das 08h às 21h. Domingo: das 09h às 14h.
 *  - Madrugada: só refrigeração, freezers e iluminação de segurança (~5 kW).
 *  - Loja aberta: iluminação, caixas e equipamentos (~13 kW) + ar-condicionado,
 *    que acompanha a temperatura e faz o pico de consumo entre 13h e 16h.
 *  - Geração: 2 arranjos de 15 kWp (painéis) ligados a 2 inversores,
 *    com curva de sino e pico perto do meio-dia (seção 2.2 do relatório).
 *  - Bateria de 20 kWh: carrega com energia solar no meio do dia e
 *    descarrega no fim da tarde, quando o sol já baixou e a loja segue aberta.
 */

/* ------------------------------------------------------------------ */
/* Aleatoriedade "com semente": o mesmo dia sempre tem o mesmo clima.  */
/* ------------------------------------------------------------------ */

function hashTexto(texto) {
  let hash = 2166136261
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Número entre 0 e 1 que depende só do texto (ex.: "2026-11-23:nuvens"). */
export function aleatorioDoDia(chave) {
  let t = hashTexto(chave) + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * Ruído suave e contínuo (RNF07): combina ondas de períodos diferentes,
 * evitando saltos independentes entre amostras consecutivas.
 */
export function ruidoSuave(momento, chave, amplitude) {
  const segundos = momento.getTime() / 1000
  const semente = (hashTexto(chave) % 1000) / 1000
  const ondaLenta = Math.sin(segundos / 1800 + semente * Math.PI * 2)
  const ondaRapida = Math.sin(segundos / 480 + semente * Math.PI)
  return 1 + (ondaLenta * 0.7 + ondaRapida * 0.3) * amplitude
}

/* ------------------------------------------------------------------ */
/* Parâmetros da instalação                                            */
/* ------------------------------------------------------------------ */

export const INSTALACAO = Object.freeze({
  potenciaPicoPorArranjoKwp: 15,
  nascerDoSolHora: 5.75,
  porDoSolHora: 18.75,
  consumoMadrugadaKw: 5,
  consumoLojaAbertaKw: 13,
  arCondicionadoMaximoKw: 10,
  capacidadeBateriaKwh: 20,
  potenciaMaximaBateriaKw: 5,
  tensaoRedeV: 380,
  tensaoBateriaV: 48,
  tensaoSensorV: 12,
})

/** Data local AAAA-MM-DD de um Date (o processo roda no fuso America/Sao_Paulo). */
export function chaveDoDia(momento) {
  const ano = momento.getFullYear()
  const mes = String(momento.getMonth() + 1).padStart(2, '0')
  const dia = String(momento.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Hora do dia em número decimal (ex.: 13:30 -> 13.5). */
const horaDecimal = (momento) => momento.getHours() + momento.getMinutes() / 60 + momento.getSeconds() / 3600

/* ------------------------------------------------------------------ */
/* Clima e sol                                                         */
/* ------------------------------------------------------------------ */

/** Características do dia (nebulosidade, calor e eventos de falha). */
export function caracteristicasDoDia(momento) {
  const dia = chaveDoDia(momento)
  return {
    dia,
    // 0 = céu limpo, 1 = muito nublado
    nebulosidade: aleatorioDoDia(`${dia}:nuvens`) ** 2 * 0.8,
    // dias quentes aumentam o ar-condicionado (e podem estourar o limite)
    calorExtra: aleatorioDoDia(`${dia}:calor`) > 0.8 ? 1 : 0,
    // falhas que o simulador provoca para demonstrar os alertas
    superaquecimentoInversor: aleatorioDoDia(`${dia}:inversor`) > 0.72,
    picoTensaoHora: aleatorioDoDia(`${dia}:tensao`) > 0.88 ? 9 + Math.floor(aleatorioDoDia(`${dia}:hora-tensao`) * 10) : null,
  }
}

/** Temperatura ambiente (°C): mínima de madrugada, máxima por volta das 15h. */
export function temperaturaAmbiente(momento, caracteristicas) {
  const hora = horaDecimal(momento)
  const base = 19 + caracteristicas.calorExtra * 4
  return base + 10 * Math.max(0, Math.sin(((hora - 9) / 24) * 2 * Math.PI + Math.PI / 4)) - caracteristicas.nebulosidade * 3
}

/** Irradiância relativa de 0 a 1 (curva de sino entre o nascer e o pôr do sol). */
export function irradiancia(momento, caracteristicas) {
  const hora = horaDecimal(momento)
  const { nascerDoSolHora, porDoSolHora } = INSTALACAO
  if (hora <= nascerDoSolHora || hora >= porDoSolHora) return 0
  const fracao = (hora - nascerDoSolHora) / (porDoSolHora - nascerDoSolHora)
  const sino = Math.sin(fracao * Math.PI) ** 1.4
  // nuvens passando: reduzem a geração de forma irregular ao longo do dia
  const nuvens = caracteristicas.nebulosidade * (0.6 + 0.4 * Math.sin(hora * 3.1 + 1.7))
  return Math.max(0, sino * (1 - nuvens))
}

/* ------------------------------------------------------------------ */
/* Consumo da loja                                                     */
/* ------------------------------------------------------------------ */

/** Horário de funcionamento: [abertura, fechamento] em horas, por dia da semana. */
export function horarioDeFuncionamento(momento) {
  return momento.getDay() === 0 ? [9, 14] : [8, 21]
}

/** Consumo da loja (kW) sem ruído. */
export function consumoLojaKw(momento, caracteristicas) {
  const hora = horaDecimal(momento)
  const [abertura, fechamento] = horarioDeFuncionamento(momento)
  const { consumoMadrugadaKw, consumoLojaAbertaKw, arCondicionadoMaximoKw } = INSTALACAO

  // Rampa de 1 h antes de abrir (equipe chegando) e 30 min depois de fechar.
  let ocupacao = 0
  if (hora >= abertura && hora < fechamento) ocupacao = 1
  else if (hora >= abertura - 1 && hora < abertura) ocupacao = hora - (abertura - 1)
  else if (hora >= fechamento && hora < fechamento + 0.5) ocupacao = 1 - (hora - fechamento) / 0.5

  // Ar-condicionado proporcional ao calor acima de 22 °C, só com a loja ocupada.
  const temperatura = temperaturaAmbiente(momento, caracteristicas)
  const arCondicionado = ocupacao * Math.min(1, Math.max(0, (temperatura - 22) / 8)) * arCondicionadoMaximoKw

  // Movimento extra no almoço e no fim da tarde.
  const movimento = ocupacao * (Math.exp(-((hora - 12.5) ** 2) / 1.5) * 2 + Math.exp(-((hora - 18.5) ** 2) / 1.2) * 2.5)

  return consumoMadrugadaKw + ocupacao * (consumoLojaAbertaKw - consumoMadrugadaKw) + arCondicionado + movimento
}

/* ------------------------------------------------------------------ */
/* Valores de cada equipamento                                         */
/* ------------------------------------------------------------------ */

/**
 * Calcula os valores instantâneos de todos os ativos em um momento.
 *
 * @param {Date} momento
 * @param {Array<{ id: number, tipo: string, codigo: string }>} ativos
 * @param {{ cargaBateriaPct: number, comRuido?: boolean, reiniciando?: (id:number)=>boolean, semFalhas?: (id:number)=>boolean }} contexto
 * @returns {Map<number, object>} ativoId -> valores (mesmos nomes da tabela telemetria_atual, em camelCase)
 */
export function valoresDosAtivos(momento, ativos, contexto) {
  const caracteristicas = caracteristicasDoDia(momento)
  const fator = (chave, amplitude) => {
    if (contexto.comRuido === false) return 1
    return ruidoSuave(momento, `${chaveDoDia(momento)}:${chave}`, amplitude)
  }
  const hora = horaDecimal(momento)
  const reiniciando = contexto.reiniciando ?? (() => false)
  const semFalhas = contexto.semFalhas ?? (() => false)

  const ambiente = temperaturaAmbiente(momento, caracteristicas)
  const sol = irradiancia(momento, caracteristicas)
  const consumoLoja = consumoLojaKw(momento, caracteristicas) * fator('consumo', 0.04)

  const paineis = ativos.filter((ativo) => ativo.tipo === 'PAINEL')
  const inversores = ativos.filter((ativo) => ativo.tipo === 'INVERSOR')
  const medidores = ativos.filter((ativo) => ativo.tipo === 'MEDIDOR')
  const valores = new Map()

  // Painéis (corrente contínua). À noite não há tensão: o valor fica nulo.
  const geracaoPorPainel = paineis.map((painel) => {
    const temperaturaPainel = ambiente + 28 * sol
    // Painel perde ~0,4% de eficiência por °C acima de 25 °C.
    const perdaTermica = 1 - Math.max(0, temperaturaPainel - 25) * 0.004
    const potencia = reiniciando(painel.id) ? 0 : INSTALACAO.potenciaPicoPorArranjoKwp * sol * perdaTermica * fator(`painel-${painel.id}`, 0.03)
    const tensao = sol > 0.02 ? 600 * (0.93 + 0.07 * sol) * fator(`tensao-painel-${painel.id}`, 0.01) : null
    valores.set(painel.id, {
      potenciaGeradaKw: potencia,
      potenciaConsumidaKw: null,
      temperaturaC: temperaturaPainel,
      tensaoV: tensao,
      correnteA: tensao ? (potencia * 1000) / tensao : 0,
      eficienciaPct: sol > 0.02 ? 20.5 * perdaTermica : null,
      cargaPct: null,
    })
    return potencia
  })

  // Inversores: o inversor N converte a energia do arranjo N (perda de ~3%).
  inversores.forEach((inversor, indice) => {
    const entradaKw = geracaoPorPainel[indice] ?? 0
    const produzindo = entradaKw > 0.05 && !reiniciando(inversor.id)
    const potencia = produzindo ? entradaKw * 0.97 : 0
    let temperatura = ambiente + 2 + (potencia / INSTALACAO.potenciaPicoPorArranjoKwp) * 30
    // Falha simulada: o segundo inversor superaquece em alguns dias entre 13h e 14h30.
    if (indice === 1 && caracteristicas.superaquecimentoInversor && hora >= 13 && hora < 14.5 && !semFalhas(inversor.id)) {
      temperatura += 22
    }
    const tensao = INSTALACAO.tensaoRedeV * fator(`tensao-inversor-${inversor.id}`, 0.008)
    valores.set(inversor.id, {
      potenciaGeradaKw: potencia,
      potenciaConsumidaKw: null,
      temperaturaC: temperatura,
      tensaoV: tensao,
      correnteA: (potencia * 1000) / (Math.sqrt(3) * tensao),
      eficienciaPct: produzindo ? 96 + 1.5 * Math.min(1, potencia / 10) : null,
      cargaPct: null,
    })
  })

  // Medidor(es) da loja: o consumo é dividido entre eles.
  medidores.forEach((medidor, indice) => {
    let tensao = INSTALACAO.tensaoRedeV * fator(`tensao-medidor-${medidor.id}`, 0.012)
    // Falha simulada: pico de tensão de 15 minutos em alguns dias.
    if (indice === 0 && caracteristicas.picoTensaoHora !== null && !semFalhas(medidor.id)) {
      if (hora >= caracteristicas.picoTensaoHora && hora < caracteristicas.picoTensaoHora + 0.25) tensao *= 1.085
    }
    const potencia = consumoLoja / medidores.length
    valores.set(medidor.id, {
      potenciaGeradaKw: null,
      potenciaConsumidaKw: potencia,
      temperaturaC: null,
      tensaoV: tensao,
      correnteA: (potencia * 1000) / (Math.sqrt(3) * tensao),
      eficienciaPct: null,
      cargaPct: null,
    })
  })

  // Bateria: com sol forte, guarda até 20% da geração (máx. 5 kW) até 95% de carga;
  // das 17h30 às 21h devolve essa energia para a loja (até 10% de carga).
  const geracaoTotal = inversores.reduce((soma, inversor) => soma + valores.get(inversor.id).potenciaGeradaKw, 0)
  for (const bateria of ativos.filter((ativo) => ativo.tipo === 'BATERIA')) {
    const carga = contexto.cargaBateriaPct
    let carregandoKw = 0
    let descarregandoKw = 0
    if (sol > 0.5 && carga < 95) carregandoKw = Math.min(INSTALACAO.potenciaMaximaBateriaKw, geracaoTotal * 0.2)
    else if (hora >= 17.5 && hora < 21 && carga > 10) descarregandoKw = 4 * fator(`bateria-${bateria.id}`, 0.05)
    valores.set(bateria.id, {
      potenciaGeradaKw: descarregandoKw,
      potenciaConsumidaKw: carregandoKw,
      temperaturaC: ambiente + 4 + (carregandoKw + descarregandoKw) * 1.2,
      tensaoV: INSTALACAO.tensaoBateriaV * (0.94 + 0.12 * (carga / 100)),
      correnteA: ((carregandoKw + descarregandoKw) * 1000) / INSTALACAO.tensaoBateriaV,
      eficienciaPct: null,
      cargaPct: carga,
    })
  }

  // Sensor ambiente: mede a temperatura do local; consome quase nada.
  for (const sensor of ativos.filter((ativo) => ativo.tipo === 'SENSOR')) {
    valores.set(sensor.id, {
      potenciaGeradaKw: null,
      potenciaConsumidaKw: 0.005,
      temperaturaC: ambiente * fator(`sensor-${sensor.id}-temperatura`, 0.01),
      tensaoV: INSTALACAO.tensaoSensorV * fator(`sensor-${sensor.id}-tensao`, 0.01),
      correnteA: 0.4,
      eficienciaPct: null,
      cargaPct: null,
    })
  }

  return valores
}

/**
 * Atualiza a carga da bateria (%) depois de `horas` com os valores dados.
 * Carregar soma energia, descarregar subtrai.
 */
export function proximaCargaBateria(cargaAtualPct, valoresBateria, horas) {
  if (!valoresBateria) return cargaAtualPct
  const saldoKwh = ((valoresBateria.potenciaConsumidaKw ?? 0) * 0.95 - (valoresBateria.potenciaGeradaKw ?? 0)) * horas
  const novaCarga = cargaAtualPct + (saldoKwh / INSTALACAO.capacidadeBateriaKwh) * 100
  return Math.min(100, Math.max(0, novaCarga))
}
