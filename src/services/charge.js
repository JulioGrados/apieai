'use strict'

const { chargeDB, userDB, dealDB } = require('db/lib')
const moment = require('moment-timezone')
const CustomError = require('custom-error-instance')
const { paymentPaycash, getToken } = require('utils/functions/paycash')
const countriesDataOriginal  = require('utils/functions/originalCountries')
const { getSocket } = require('../lib/io')
const { paymentDlocal, getPaymentDlocal } = require('utils/functions/dlocal')
const { createEmailOnly } = require('./email')
const { sendEmail } = require('utils/lib/sendgrid')

const listCharges = async params => {
  console.log('--------------------------------------------------------')
  console.log('charge')
  console.log('--------------------------------------------------------')
  const charges = await chargeDB.list(params)
  return charges
}

const createCharge = async (body, loggedCharge) => {
  try {
    const expiration = moment().add('days', 7).format('YYYY-MM-DD') 
    const data = {
      Amount: body.amount,
      ExpirationDate: expiration,
      Value: body.deal._id,
      Type: true
    }
    
    const country = body.money && countriesDataOriginal.find(o => o.code == body.money)
    const lowerCountry = country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const token = await getToken(lowerCountry)
    const payment = await paymentPaycash(JSON.stringify(data), token.data.Authorization, lowerCountry)
    const dataCharge = {
      ...body,
      statusPayment: 'Por Pagar',
      endDate: expiration,
      reference: payment.data.Reference,
      token: token.data.Authorization,
      money: body.money ? body.money : ''
    }
    const charge = await chargeDB.create(dataCharge)
    const detail = await chargeDB.detail({query : {_id: charge._id.toString()}, populate: ['linked.ref']})
    return detail
  } catch (error) {
    throw error
  }
}

const createPaymentdLocal = async (body, loggedCharge) => {
  console.log('body', body)
  try {
    const dataCharge = {
      payer: {
        firstName: body.firstNameOne + ' ' + body.firstNameTwo,
        lastName: body.lastName,
        document: body.document,
        email: body.email,
        dni: body.dni
      },
      statusPayment: 'Por Pagar',
      country: body.country,
      money: body.currency,
      symbol: body.symbol,
      amount: body.amount,
      waytopay: 'dLocal',
      isActive: false
    }
    const charge = await chargeDB.create(dataCharge)
    console.log('charge', charge)
    const payment = await paymentDlocal({
      amount: body.amount,
      currency: body.currency,
      country: body.country,
      payer: {
          name: body.firstNameOne + ' ' + body.lastName,
          email: body.email,
          document_type: body.document,
          document: body.dni
      },
      order_id: charge._id.toString(),
      success_url: "https://www.eai.edu.pe/completado/" + charge._id.toString(),
      back_url: "https://www.eai.edu.pe/pagos/" + body.currency + "/" + body.amount + "/",
      notification_url: "https://api.eai.edu.pe/api/open/charge/notification"
    })
    console.log('payment', payment)
    const updateCharge = await chargeDB.update(charge._id, {
      paymentMethodId: payment.id,
      authorization: payment.merchant_checkout_token
    })
    console.log('updateCharge', updateCharge)
    return payment
  } catch (error) {
    const dataError = error && error.response ? error.response.data : error
    if (dataError) {
      throw dataError
    } else {
      throw error
    }
  }
}

const notificationChargeOpen = async body => {
  const charge = await chargeDB.detail({ query: { paymentMethodId: body.payment_id } })
  const payment = await getPaymentDlocal(charge.paymentMethodId)
  const chargeUpdate = await chargeDB.update(charge._id, {
    statusPayment: payment.status,
  })
  console.log('chargeUpdate', chargeUpdate)
  return chargeUpdate
}

const detailChargeOpen = async params => {
  console.log('params', params)
  try {
    const charge = await chargeDB.detail(params)
    const payment = await getPaymentDlocal(charge.paymentMethodId)
    const chargeUpdate = await chargeDB.update(charge._id, {
      isActive: true,
    })
    console.log('charge', charge)
    const data = {
      ...charge.toJSON(),
      status: payment.status,
      paymentId: payment.id,
      success: true
    }
    let msg = {
      to: charge.payer && charge.payer.email,
      cc: 'gerencia@eai.edu.pe',
      from: 'gerencia@eai.edu.pe',
      subject: `Constancia de Pago - ${charge.payer && charge.payer.firstName} ${charge.payer && charge.payer.lastName}`,
      html: `Hola ${charge.payer && charge.payer.firstName} ${charge.payer && charge.payer.lastName}<br>` +
        `<br>Tu pago fue realizado exitosamente, a continuación te mostramos el detalle del pago:<br>` +
        `Monto: ${charge.symbol}. ${charge.amount}.00<br>` +
        `Fecha: ${moment(charge.createdAt).format('DD/MM/YYYY')}<br>` +
        `Hora: ${moment(charge.createdAt).format('HH:mm:ss')}<br>` +
        `País: ${charge.country}<br>` +
        `OP: ${charge._id}<br>` +
        `Nombre del cliente: ${charge.payer && charge.payer.firstName} ${charge.payer && charge.payer.lastName}<br>` +
        `Documento de identididad: ${charge.payer && charge.payer.document}<br>` +
        `Número de documento: ${charge.payer && charge.payer.dni}<br>` +
        `ID: ${charge.paymentMethodId}<br>` +
        `<br> Toma un pantallazo o foto de este voucher y envíalo a una de nuestras asesoras de Escuela Americana de Innovación por WhatsApp al +514800022 para registrar tu pago, emitirte un comprobante de pago y activar tus accesos.`,
      content: `Hola ${charge.payer && charge.payer.firstName} ${charge.payer && charge.payer.lastName}<br>` +
        `<br>Tu pago fue realizado exitosamente, a continuación te mostramos el detalle del pago:<br>` +
        `Monto: ${charge.symbol}. ${charge.amount}.00<br>` +
        `Fecha: ${moment(charge.createdAt).format('DD/MM/YYYY')}<br>` +
        `Hora: ${moment(charge.createdAt).format('HH:mm:ss')}<br>` +
        `País: ${charge.country}<br>` +
        `OP: ${charge._id}<br>` +
        `Nombre del cliente: ${charge.payer && charge.payer.firstName} ${charge.payer && charge.payer.lastName}<br>` +
        `Documento de identididad: ${charge.payer && charge.payer.document}<br>` +
        `Número de documento: ${charge.payer && charge.payer.dni}<br>` +
        `ID: ${charge.paymentMethodId}<br>` +
        `<br> Toma un pantallazo o foto de este voucher y envíalo a una de nuestras asesoras de Escuela Americana de Innovación por WhatsApp al +514800022 para registrar tu pago, emitirte un comprobante de pago y activar tus accesos.`,
      fromname: `Escuela Americana de Innovación`
    }
    const email = await createEmailOnly(msg)
    const emailUser = await sendEmail(msg)
    console.log('data', data)
    return data
  } catch (error) {
    throw error
  }
}

const updateCharge = async (chargeId, body, loggedCharge) => {
  const charge = await chargeDB.update(chargeId, body)
  return charge
}

const updateStatusCharge = async (body, loggedCall) => {
  const charge = await chargeDB.detail({ query: { reference: body.Referencia } })
  console.log('charge', charge)
  const deal = await dealDB.detail({ query: { _id: charge.deal.toString() }, populate: ['client'] })
  console.log('deal', deal)
  const chargeUpdate = await chargeDB.update(charge._id, {
    statusPayment: 'Pago',
    payDate: body.FechaConfirmation,
    authorization: body.Autorizacion
  })
  emitCharge(chargeUpdate, deal.assessor)
  emitPopUpCharge({
    ...deal.toJSON(),
    ...chargeUpdate.toJSON(),
    ref: deal._id
  }, deal.assessor)
  return chargeUpdate
}

const detailCharge = async params => {
  const charge = await chargeDB.detail(params)
  return charge
}

const deleteCharge = async (chargeId, loggedCharge) => {
  const charge = await chargeDB.remove(chargeId)
  return charge
}

const countDocuments = async params => {
  const count = await chargeDB.count(params)
  return count
}

/* functions */

const emitCharge = (charge, assesor) => {
  if (assesor) {
    console.log('llamado charge', charge)
    console.log('llamado assesor', assesor)
    const io = getSocket()
    io.to(assesor.ref.toString()).emit('charge', charge)
  }
}

const emitPopUpCharge = (deal, assesor) => {
  console.log('deal send pop', deal)
  if (assesor) {
    console.log('pago entrante')
    const io = getSocket()
    io.to(assesor.ref.toString()).emit('popupcharge', deal)
  }
}


module.exports = {
  countDocuments,
  listCharges,
  createCharge,
  createPaymentdLocal,
  notificationChargeOpen,
  updateCharge,
  updateStatusCharge,
  detailCharge,
  detailChargeOpen,
  deleteCharge
}