/**
 * Configuração do ambiente.
 *
 * Lê as variáveis do arquivo .env uma única vez e expõe um objeto já
 * convertido (números, booleanos, listas). O resto do código importa
 * `ambiente` em vez de acessar `process.env` diretamente.
 */
import 'dotenv/config'

/**
 * Fuso horário oficial do sistema (RN14 / DP03).
 * Todas as consultas diárias, mensais e semanais usam este fuso para
 * decidir "a que dia pertence" cada leitura.
 */
export const FUSO_HORARIO = 'America/Sao_Paulo'

// Garante que as datas criadas no Node (ex.: pelo simulador) usem o mesmo fuso.
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

export const ambiente = {
  // PORT é definida automaticamente por serviços de hospedagem (ex.: Render).
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
