/**
 * Envio de e-mail com Nodemailer (recuperação de senha — RF04).
 *
 * Se o SMTP não estiver configurado no .env, o link é apenas exibido no
 * terminal da API. Assim dá para testar o fluxo completo sem servidor de
 * e-mail.
 */
import nodemailer from 'nodemailer'
import { ambiente } from '../../config/ambiente.js'

const transporte = ambiente.email.host
  ? nodemailer.createTransport({
      host: ambiente.email.host,
      port: ambiente.email.porta,
      secure: ambiente.email.porta === 465,
      auth: { user: ambiente.email.usuario, pass: ambiente.email.senha },
    })
  : null

export const emailServico = {
  async enviarRecuperacaoSenha({ para, nome, link, validadeMinutos }) {
    const texto = [
      `Olá, ${nome}!`,
      '',
      'Recebemos um pedido para redefinir a sua senha do SunGrid.',
      `Use o link abaixo em até ${validadeMinutos} minutos:`,
      link,
      '',
      'Se você não fez este pedido, ignore este e-mail.',
    ].join('\n')

    if (!transporte) {
      console.info(`[e-mail simulado] Para: ${para}\n${texto}\n`)
      return
    }

    await transporte.sendMail({
      from: ambiente.email.remetente,
      to: para,
      subject: 'SunGrid — redefinição de senha',
      text: texto,
    })
  },
}
