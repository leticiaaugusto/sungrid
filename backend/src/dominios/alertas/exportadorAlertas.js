/**
 * Geração do relatório de alertas em CSV, XLSX (ExcelJS) e PDF (PDFKit) — RNF21.
 */
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { FUSO_HORARIO } from '../../config/ambiente.js'

const ROTULOS_STATUS = { ATIVO: 'Ativo', RESOLVIDO: 'Resolvido' }
const ROTULOS_PRIORIDADE = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_HORARIO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dataHora = (valor) => (valor ? formatoDataHora.format(new Date(valor)) : '')

const COLUNAS = [
  { titulo: 'ID', largura: 6, valor: (alerta) => alerta.id },
  { titulo: 'Status', largura: 11, valor: (alerta) => ROTULOS_STATUS[alerta.status] ?? alerta.status },
  { titulo: 'Data / Hora', largura: 18, valor: (alerta) => dataHora(alerta.criadoEm) },
  { titulo: 'Descrição', largura: 60, valor: (alerta) => alerta.descricao },
  { titulo: 'Prioridade', largura: 11, valor: (alerta) => ROTULOS_PRIORIDADE[alerta.prioridade] ?? alerta.prioridade },
  { titulo: 'Ativo', largura: 12, valor: (alerta) => alerta.ativo?.codigo ?? 'Instalação' },
  { titulo: 'Resolvido em', largura: 18, valor: (alerta) => dataHora(alerta.resolvidoEm) },
]

/** Evita que o Excel interprete textos iniciados por = + - @ como fórmula. */
function celulaCsvSegura(valor) {
  const texto = String(valor ?? '')
  const seguro = /^[\t\r\n ]*[=+\-@]/.test(texto) ? `'${texto}` : texto
  return `"${seguro.replaceAll('"', '""')}"`
}

function gerarCsv(alertas) {
  const linhas = [
    COLUNAS.map((coluna) => coluna.titulo),
    ...alertas.map((alerta) => COLUNAS.map((coluna) => coluna.valor(alerta))),
  ]
  // O caractere BOM (\uFEFF) faz o Excel abrir acentos corretamente; ";" é o separador do Excel em pt-BR.
  const texto = `\uFEFF${linhas.map((linha) => linha.map(celulaCsvSegura).join(';')).join('\r\n')}`
  return Buffer.from(texto, 'utf-8')
}

async function gerarXlsx(alertas) {
  const pasta = new ExcelJS.Workbook()
  pasta.creator = 'SunGrid'
  const planilha = pasta.addWorksheet('Alertas')
  planilha.columns = COLUNAS.map((coluna) => ({ header: coluna.titulo, width: coluna.largura }))
  planilha.getRow(1).font = { bold: true }
  for (const alerta of alertas) {
    planilha.addRow(COLUNAS.map((coluna) => coluna.valor(alerta)))
  }
  return Buffer.from(await pasta.xlsx.writeBuffer())
}

function gerarPdf(alertas, filtros) {
  return new Promise((resolver, rejeitar) => {
    const documento = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 })
    const partes = []
    documento.on('data', (parte) => partes.push(parte))
    documento.on('end', () => resolver(Buffer.concat(partes)))
    documento.on('error', rejeitar)

    documento.fontSize(16).text('SunGrid — Relatório de Alertas')
    documento
      .fontSize(9)
      .fillColor('#555555')
      .text(
        `Gerado em ${dataHora(new Date())} | Status: ${filtros.status ?? 'todos'} | ` +
          `Prioridade: ${filtros.prioridade ?? 'todas'} | ${alertas.length} alerta(s)`,
      )
      .moveDown()

    // Tabela simples: larguras proporcionais à largura útil da página.
    const larguraUtil = documento.page.width - 72
    const totalLarguras = COLUNAS.reduce((soma, coluna) => soma + coluna.largura, 0)
    const larguras = COLUNAS.map((coluna) => (coluna.largura / totalLarguras) * larguraUtil)

    const desenharLinha = (valores, negrito = false) => {
      const y = documento.y
      let x = 36
      let alturaLinha = 0
      documento.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('#000000')
      valores.forEach((valor, indice) => {
        const altura = documento.heightOfString(String(valor), { width: larguras[indice] - 4 })
        alturaLinha = Math.max(alturaLinha, altura)
        documento.text(String(valor), x, y, { width: larguras[indice] - 4 })
        x += larguras[indice]
      })
      documento.y = y + alturaLinha + 4
      documento.moveTo(36, documento.y - 2).lineTo(36 + larguraUtil, documento.y - 2).strokeColor('#dddddd').stroke()
      if (documento.y > documento.page.height - 60) documento.addPage()
    }

    desenharLinha(COLUNAS.map((coluna) => coluna.titulo), true)
    if (alertas.length === 0) {
      documento.font('Helvetica').text('Nenhum alerta encontrado para os filtros selecionados.', 36)
    }
    for (const alerta of alertas) {
      desenharLinha(COLUNAS.map((coluna) => coluna.valor(alerta)))
    }
    documento.end()
  })
}

export const exportadorAlertas = {
  formatosSuportados: ['csv', 'xlsx', 'pdf'],

  /** @returns {Promise<{ conteudo: Buffer, tipoMime: string, nomeArquivo: string }>} */
  async gerar(alertas, formato, filtros) {
    const data = new Date().toISOString().slice(0, 10)
    const nomeArquivo = `relatorio-alertas-${data}.${formato}`

    if (formato === 'xlsx') {
      return {
        conteudo: await gerarXlsx(alertas),
        tipoMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        nomeArquivo,
      }
    }
    if (formato === 'pdf') {
      return { conteudo: await gerarPdf(alertas, filtros), tipoMime: 'application/pdf', nomeArquivo }
    }
    return { conteudo: gerarCsv(alertas), tipoMime: 'text/csv; charset=utf-8', nomeArquivo }
  },
}
