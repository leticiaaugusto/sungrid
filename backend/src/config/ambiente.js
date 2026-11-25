
import 'dotenv/config'

// Esta constante disponibiliza FUSO_HORARIO para outras partes do projeto.

export const FUSO_HORARIO = 'America/Sao_Paulo'

process.env.TZ = FUSO_HORARIO

function obrigatoria(nome) {
  const valor = process.env[nome]
  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${nome}. Confira o arquivo .env.`)
  }
  return valor
}

function inteiroEntre(nome, padrao, minimo, maximo) {
  const texto = process.env[nome]
  if (!texto) return padrao
  const valor = Number(texto)
  return Number.isInteger(valor) && valor >= minimo && valor <= maximo ? valor : padrao
}

// Esta constante disponibiliza ambiente para outras partes do projeto.

export const ambiente = {

  porta: Number(process.env.PORT ?? process.env.PORTA ?? 3000),
  urlFrontend: process.env.URL_FRONTEND ?? 'http://localhost:5173',

  banco: {
    url: obrigatoria('DATABASE_URL'),
    ssl: process.env.BANCO_SSL === 'true',
  },

  jwt: {
    segredo: obrigatoria('JWT_SEGREDO'),
    expiracao: process.env.JWT_EXPIRACAO ?? '8h',
  },

  tokenRecuperacaoMinutos: Number(process.env.TOKEN_RECUPERACAO_MINUTOS ?? 30),

  dominiosPermitidos: (process.env.DOMINIOS_PERMITIDOS ?? '')
    .split(',')
    .map((dominio) => dominio.trim().toLowerCase())
    .filter(Boolean),

  email: {
    host: process.env.SMTP_HOST ?? '',
    porta: Number(process.env.SMTP_PORTA ?? 587),
    usuario: process.env.SMTP_USUARIO ?? '',
    senha: process.env.SMTP_SENHA ?? '',
    remetente: process.env.EMAIL_REMETENTE ?? 'SunGrid <nao-responda@sungrid.local>',
  },

  simuladorAtivo: process.env.SIMULADOR_ATIVO !== 'false',
  simuladorTelemetriaSeg: inteiroEntre('SIMULADOR_TELEMETRIA_SEG', 5, 1, 60),
  simuladorLeituraMin: inteiroEntre('SIMULADOR_LEITURA_MIN', 15, 1, 60),
}
