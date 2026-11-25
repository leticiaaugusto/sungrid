
import cron from 'node-cron'
import { AlertaService } from '../dominios/alertas/AlertaService.js'

export function agendarDeteccaoOffline() {
  return cron.schedule('* * * * *', async () => {
    try {
      await AlertaService.verificarAtivosOffline()
    } catch (erro) {
      console.error('[job offline] falhou:', erro.message)
    }
  })
}
