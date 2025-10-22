'use strict'

const { claimDB } = require('db/lib')
const { sendEmail } = require('utils/lib/sendgrid')
const { createEmailOnly } = require('./email')

const listClaims = async params => {
  const claims = await claimDB.list(params)
  return claims
}

const createClaim = async (body, loggedClaim) => {
  const claim = await claimDB.create(body)
  let msg = {
    to: body.email,
    cc: 'gerencia@eai.edu.pe',
    from: 'gerencia@eai.edu.pe',
    subject: `[${body.option}] - ${body.firstName} ${body.lastName}]`,
    html: `Nombres: ${body.firstName}<br>Apellidos: ${body.lastName}<br>Email: ${body.email}<br>DNI: ${body.dni}<br>Dirección: ${body.address}<br>Teléfono: ${body.mobile}<br>Detalle: ${body.detail}<br>Pedido: ${body.order}<br>`,
    content: `Nombres: ${body.firstName}<br>Apellidos: ${body.lastName}<br>Email: ${body.email}<br>DNI: ${body.dni}<br>Dirección: ${body.address}<br>Teléfono: ${body.mobile}<br>Detalle: ${body.detail}<br>Pedido: ${body.order}<br>`,
    fromname: `Escuela Americana de Innovación`
  }
  const email = await createEmailOnly(msg)
  const emailUser = await sendEmail(msg)
  msg.to = 'gerencia@eai.edu.pe'
  const emailGerencia = await sendEmail(msg)
  msg.to = 'docentes@eai.edu.pe'
  const emailDocentes = await sendEmail(msg)
  return claim
}

const updateClaim = async (claimId, body, loggedClaim) => {
  const claim = await claimDB.update(claimId, body)
  return claim
}

const detailClaim = async params => {
  const claim = await claimDB.detail(params)
  return claim
}

const deleteClaim = async (claimId, loggedClaim) => {
  const claim = await claimDB.remove(claimId)
  return claim
}

const countDocuments = async params => {
  const count = await claimDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listClaims,
  createClaim,
  updateClaim,
  detailClaim,
  deleteClaim
}
