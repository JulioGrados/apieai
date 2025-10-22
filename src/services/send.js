'use strict'

const { sendDB } = require('db/lib')
const { sendSimple } = require('utils/lib/sendgrid')
const { createEmailOnly } = require('./email')

const createEmaiSend = async (body) => {
  const msg = {
    to: body.to,
    from: 'cursos@eai.edu.pe',
    fromname: 'Escuela Americana de Innovación',
    subject: body.subject,
    html: body.content,
    content: body.content
  }
  const email = await createEmailOnly(msg)
  const send = await sendSimple(msg)
  return send
}

const listSends = async params => {
  const sends = await sendDB.list(params)
  return sends
}

const createSend = async (body, loggedUser) => {
  const send = await sendDB.create(body)
  
  const email = await createEmaiSend(body)
  if (!email) {
    const error = {
      status: 402,
      message: 'Los campos requeridos para enviar un mail, no están completos.'
    }
    throw error
  }
  return send
}

const updateSend = async (sendId, body, loggedUser) => {
  const send = await sendDB.update(sendId, body)
  return send
}

const detailSend = async params => {
  const send = await sendDB.detail(params)
  return send
}

const deleteSend = async (sendId, loggedUser) => {
  const send = await sendDB.remove(sendId)
  return send
}

const countDocuments = async params => {
  const count = await sendDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listSends,
  createSend,
  updateSend,
  detailSend,
  deleteSend
}
