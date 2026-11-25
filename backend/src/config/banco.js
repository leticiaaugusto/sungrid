
import pg from 'pg'
import { ambiente } from './ambiente.js'

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor) => (valor === null ? null : Number(valor)))

pg.types.setTypeParser(pg.types.builtins.INT8, (valor) => (valor === null ? null : Number(valor)))

pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor)

// Esta constante disponibiliza pool para outras partes do projeto.

export const pool = new pg.Pool({
  connectionString: ambiente.banco.url,
  ssl: ambiente.banco.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
})

export function consultar(sql, parametros = []) {
  return pool.query(sql, parametros)
}

export async function emTransacao(operacao) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const resultado = await operacao(cliente)
    await cliente.query('COMMIT')
    return resultado
  } catch (erro) {
    await cliente.query('ROLLBACK')
    throw erro
  } finally {
    cliente.release()
  }
}
