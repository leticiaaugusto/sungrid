
// Esta função transforma um texto em uma semente que gera resultados sempre iguais.
function hashTexto(texto) {
  let hash = 2166136261
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function aleatorioDoDia(chave) {
  // O mesmo valor é gerado para a mesma chave, por isso o dia não muda a cada cálculo.
  let t = hashTexto(chave) + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function ruidoSuave(momento, chave, amplitude) {
  // Este ruído evita que os valores do simulador mudem de forma abrupta.
  const segundos = momento.getTime() / 1000
  const semente = (hashTexto(chave) % 1000) / 1000
  const ondaLenta = Math.sin(segundos / 1800 + semente * Math.PI * 2)
  const ondaRapida = Math.sin(segundos / 480 + semente * Math.PI)
  return 1 + (ondaLenta * 0.7 + ondaRapida * 0.3) * amplitude
}

// Estes são os equipamentos e limites usados pela loja simulada.
// Esta constante disponibiliza INSTALACAO para outras partes do projeto.
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

export function chaveDoDia(momento) {
  // O dia é usado como chave para manter o clima e as falhas consistentes.
  const ano = momento.getFullYear()
  const mes = String(momento.getMonth() + 1).padStart(2, '0')
  const dia = String(momento.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// Esta função transforma 13h30 em 13,5 para facilitar os cálculos.
const horaDecimal = (momento) => momento.getHours() + momento.getMinutes() / 60 + momento.getSeconds() / 3600

export function caracteristicasDoDia(momento) {
  // O clima e as falhas mudam por dia, mas permanecem iguais durante esse dia.
  const dia = chaveDoDia(momento)
  return {
    dia,

    nebulosidade: aleatorioDoDia(`${dia}:nuvens`) ** 2 * 0.8,

    calorExtra: aleatorioDoDia(`${dia}:calor`) > 0.8 ? 1 : 0,

    superaquecimentoInversor: aleatorioDoDia(`${dia}:inversor`) > 0.72,
    picoTensaoHora: aleatorioDoDia(`${dia}:tensao`) > 0.88 ? 9 + Math.floor(aleatorioDoDia(`${dia}:hora-tensao`) * 10) : null,
  }
}

export function temperaturaAmbiente(momento, caracteristicas) {
  // A temperatura sobe ao longo do dia e cai à noite.
  const hora = horaDecimal(momento)
  const base = 19 + caracteristicas.calorExtra * 4
  return base + 10 * Math.max(0, Math.sin(((hora - 9) / 24) * 2 * Math.PI + Math.PI / 4)) - caracteristicas.nebulosidade * 3
}

export function irradiancia(momento, caracteristicas) {
  // Esta função calcula a luz solar disponível em cada horário.
  const hora = horaDecimal(momento)
  const { nascerDoSolHora, porDoSolHora } = INSTALACAO
  if (hora <= nascerDoSolHora || hora >= porDoSolHora) return 0
  const fracao = (hora - nascerDoSolHora) / (porDoSolHora - nascerDoSolHora)
  const sino = Math.sin(fracao * Math.PI) ** 1.4

  const nuvens = caracteristicas.nebulosidade * (0.6 + 0.4 * Math.sin(hora * 3.1 + 1.7))
  return Math.max(0, sino * (1 - nuvens))
}

export function horarioDeFuncionamento(momento) {
  // Nos domingos a loja abre mais tarde e fecha mais cedo.
  return momento.getDay() === 0 ? [9, 14] : [8, 21]
}

export function consumoLojaKw(momento, caracteristicas) {
  // Aqui o consumo varia conforme horário, clima e movimentação da loja.
  const hora = horaDecimal(momento)
  const [abertura, fechamento] = horarioDeFuncionamento(momento)
  const { consumoMadrugadaKw, consumoLojaAbertaKw, arCondicionadoMaximoKw } = INSTALACAO

  let ocupacao = 0
  // Durante a abertura existe ocupação total; antes e depois a loja entra ou sai aos poucos.
  if (hora >= abertura && hora < fechamento) ocupacao = 1
  else if (hora >= abertura - 1 && hora < abertura) ocupacao = hora - (abertura - 1)
  else if (hora >= fechamento && hora < fechamento + 0.5) ocupacao = 1 - (hora - fechamento) / 0.5

  const temperatura = temperaturaAmbiente(momento, caracteristicas)
  // Dias mais quentes fazem o ar-condicionado consumir mais energia.
  const arCondicionado = ocupacao * Math.min(1, Math.max(0, (temperatura - 22) / 8)) * arCondicionadoMaximoKw

  const movimento = ocupacao * (Math.exp(-((hora - 12.5) ** 2) / 1.5) * 2 + Math.exp(-((hora - 18.5) ** 2) / 1.2) * 2.5)

  return consumoMadrugadaKw + ocupacao * (consumoLojaAbertaKw - consumoMadrugadaKw) + arCondicionado + movimento
}

// Esta função calcula os valores atuais de todos os equipamentos da loja.
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

  const geracaoPorPainel = paineis.map((painel) => {
    // Os painéis perdem eficiência quando aquecem.
    const temperaturaPainel = ambiente + 28 * sol

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

  inversores.forEach((inversor, indice) => {
    // O inversor recebe a energia dos painéis e perde uma pequena parte na conversão.
    const entradaKw = geracaoPorPainel[indice] ?? 0
    const produzindo = entradaKw > 0.05 && !reiniciando(inversor.id)
    const potencia = produzindo ? entradaKw * 0.97 : 0
    let temperatura = ambiente + 2 + (potencia / INSTALACAO.potenciaPicoPorArranjoKwp) * 30

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

  medidores.forEach((medidor, indice) => {
    // O medidor distribui o consumo total da loja igualmente entre os medidores cadastrados.
    let tensao = INSTALACAO.tensaoRedeV * fator(`tensao-medidor-${medidor.id}`, 0.012)

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

  const geracaoTotal = inversores.reduce((soma, inversor) => soma + valores.get(inversor.id).potenciaGeradaKw, 0)
  // A bateria carrega com o excesso de sol e descarrega no fim da tarde.
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

  for (const sensor of ativos.filter((ativo) => ativo.tipo === 'SENSOR')) {
    // O sensor representa o equipamento que envia temperatura e tensão à rede.
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

export function proximaCargaBateria(cargaAtualPct, valoresBateria, horas) {
  // Esta função atualiza a carga da bateria a partir da energia carregada ou descarregada.
  if (!valoresBateria) return cargaAtualPct
  const saldoKwh = ((valoresBateria.potenciaConsumidaKw ?? 0) * 0.95 - (valoresBateria.potenciaGeradaKw ?? 0)) * horas
  const novaCarga = cargaAtualPct + (saldoKwh / INSTALACAO.capacidadeBateriaKwh) * 100
  return Math.min(100, Math.max(0, novaCarga))
}
