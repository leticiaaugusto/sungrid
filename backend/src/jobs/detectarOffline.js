/**
 * Job agendado (node-cron): detecção de equipamentos offline a cada minuto.
 *
 * Atende o RF27 (falha de comunicação / sensor offline) dentro do prazo
 * do RNF17 (alerta crítico em até 1 minuto após a detecção).
 */
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
