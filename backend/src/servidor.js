
import { ambiente } from './config/ambiente.js'
import { pool } from './config/banco.js'
import { criarApp } from './app.js'
import { SimuladorService } from './dominios/simulador/SimuladorService.js'
import { agendarDeteccaoOffline } from './jobs/detectarOffline.js'

async function iniciar() {

  await pool.query('SELECT 1')

  const app = criarApp()
  const servidor = app.listen(ambiente.porta, () => {
    console.info(`API do SunGrid em http://localhost:${ambiente.porta}/api/v1`)
  })

  const job = agendarDeteccaoOffline()

  if (ambiente.simuladorAtivo) {
    await SimuladorService.iniciar()
  } else {
    console.info('[simulador] desligado (SIMULADOR_ATIVO=false).')
  }

  const encerrar = async () => {
    console.info('\nEncerrando...')
    SimuladorService.parar()
    job.stop()
    servidor.close()
    await pool.end()
    process.exit(0)
  }
  process.on('SIGINT', encerrar)
  process.on('SIGTERM', encerrar)
}

iniciar().catch((erro) => {
  console.error('Não foi possível iniciar a API:', erro.message)
  process.exit(1)
})
