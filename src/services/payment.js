'use strict'

const { paymentDB } = require('db/lib')

const listPayments = async params => {
  const payments = await paymentDB.list(params)
  return payments
}

const createPayment = async (body, loggedUser) => {
  const payment = await paymentDB.create(body)
  return payment
}

const updatePayment = async (paymentId, body, loggedUser) => {
  const payment = await paymentDB.update(paymentId, body)
  return payment
}

const detailPayment = async params => {
  const payment = await paymentDB.detail(params)
  return payment
}

const deletePayment = async (paymentId, loggedUser) => {
  const payment = await paymentDB.remove(paymentId)
  return payment
}

const countDocuments = async params => {
  const count = await paymentDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listPayments,
  createPayment,
  updatePayment,
  detailPayment,
  deletePayment
}
