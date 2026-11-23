/**
 * Conexão com o PostgreSQL.
 *
 * Usa um "pool" de conexões do pacote `pg`. Apenas os repositórios
 * importam este arquivo: rotas e serviços nunca falam com o banco
 * diretamente (camadas descritas na seção 2.2 do relatório).
 */
import pg from 'pg'
import { ambiente } from './ambiente.js'

// O PostgreSQL devolve NUMERIC como texto para não perder precisão.
// Aqui convertemos para número do JavaScript, suficiente para kW, kWh e R$.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (valor) => (valor === null ? null : Number(valor)))
// BIGINT (ex.: COUNT(*) e BIGSERIAL) também vira número.
pg.types.setTypeParser(pg.types.builtins.INT8, (valor) => (valor === null ? null : Number(valor)))
// DATE continua texto "AAAA-MM-DD" (sem virar Date com fuso, que mudaria o dia).
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor)

export const pool = new pg.Pool({
  connectionString: ambiente.banco.url,
  ssl: ambiente.banco.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
})

/**
 * Executa uma consulta SQL com parâmetros ($1, $2, ...).
 * Sempre use parâmetros em vez de concatenar texto (evita SQL injection).
 */
export function consultar(sql, parametros = []) {
  return pool.query(sql, parametros)
}

/**
 * Executa várias operações dentro de uma transação.
 * Se qualquer passo falhar, tudo é desfeito (ROLLBACK).
 *
 * @param {(cliente: pg.PoolClient) => Promise<T>} operacao
 */
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
