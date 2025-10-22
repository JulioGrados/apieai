'use strict'

const service = require('../services/order')

const listOrders = async (req, res) => {
  const orders = await service.listOrders(req.query)
  return res.status(200).json(orders)
}

const createOrder = async (req, res, next) => {
  try {
    const order = await service.createOrder(req.body, req.user)
    return res.status(201).json(order)
  } catch (error) {
    console.log(error)
    next(error)
  }
}

const assessorOrders = async (req, res, next) => {
  try {
    const orders = await service.assessorOrders(req.query)
    return res.status(200).json(orders)
  } catch (error) {
    next(error)
  }
}

const updateOrder = async (req, res, next) => {
  const orderId = req.params.id
  try {
    const order = await service.updateOrder(orderId, req.body, req.user)
    return res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}

const updateOrderAdmin = async (req, res, next) => {
  const orderId = req.params.id
  try {
    const order = await service.updateOrderAdmin(orderId, req.body, req.user)
    return res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}

const detailOrder = async (req, res, next) => {
  const orderId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = orderId
  } else {
    params.query = {
      _id: orderId
    }
  }

  try {
    const order = await service.detailOrder(params)
    return res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}

const deleteOrder = async (req, res, next) => {
  const orderId = req.params.id
  try {
    const order = await service.deleteOrder(orderId, req.user)
    return res.status(201).json(order)
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
  listOrders,
  assessorOrders,
  createOrder,
  updateOrder,
  updateOrderAdmin,
  detailOrder,
  deleteOrder
}
