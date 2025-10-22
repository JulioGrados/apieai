'use strict'

const service = require('../services/payment')

const listPayments = async (req, res) => {
  const payments = await service.listPayments(req.query)
  return res.status(200).json(payments)
}

const createPayment = async (req, res, next) => {
  try {
    const payment = await service.createPayment(req.body, req.user)
    return res.status(201).json(payment)
  } catch (error) {
    next(error)
  }
}

const updatePayment = async (req, res, next) => {
  const paymentId = req.params.id
  try {
    const payment = await service.updatePayment(
      paymentId,
      req.body,
      req.whatsapp
    )
    return res.status(200).json(payment)
  } catch (error) {
    next(error)
  }
}

const detailPayment = async (req, res, next) => {
  const paymentId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = paymentId
  } else {
    params.query = {
      _id: paymentId
    }
  }

  try {
    const whatsapp = await service.detailPayment(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const deletePayment = async (req, res, next) => {
  const paymentId = req.params.id
  try {
    const payment = await service.deletePayment(paymentId, req.whatsapp)
    return res.status(201).json(payment)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listPayments,
  createPayment,
  updatePayment,
  detailPayment,
  deletePayment
}
