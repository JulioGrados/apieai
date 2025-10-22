'use strict'

const { orderDB } = require('db/lib')
const service = require('../services/sale')

const listSales = async (req, res) => {
  const sales = await service.listSales(req.query)
  return res.status(200).json(sales)
}

const createSales = async (req, res, next) => {
  try {
    const sale = await service.createSale(req.body, req.user)
    const ordersNew = await Promise.all(sale.orders.map(async order => {
      const orderNew = await orderDB.detail({query: {_id: order._id}, populate: ['student.ref', 'course.ref', 'voucher.ref']})
      return { ...orderNew.toJSON() }
    }))
    return res.status(201).json({
      ...sale.toJSON(),
      orders: ordersNew})
  } catch (error) {
    next(error)
  }
}

const searchSales = async (req, res, next) => {
  try {
    const sales = await service.searchSales(req.query)
    return res.status(200).json(sales)
  } catch (error) {
    next(error)
  }
}

const resetSale = async (req, res, next) => {
  try {
    const sale = await service.resetSale(req.body, req.user)
    return res.status(201).json(sale)
  } catch (error) {
    next(error)
  }
}

const assessorSales = async (req, res, next) => {
  try {
    const sales = await service.assessorSales(req.query)
    const salesNew = await Promise.all(sales.map(async sale => {
      const ordersPopulate = await Promise.all(sale.orders.map(async order => {
        const orderNew = await orderDB.detail({query: {_id: order._id}, populate: ['student.ref', 'course.ref', 'voucher.ref']})
        return { ...orderNew.toJSON() }
      }))
      return {
        ...sale.toJSON(),
        orders: ordersPopulate
      }
    }))
    return res.status(200).json(salesNew)
  } catch (error) {
    next(error)
  }
}

const updateSaleOne = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  const saleId = req.params.id
  try {
    const sale = await service.updateSaleOne(saleId, req.body, files, req.user)
    return res.status(200).json(sale)
  } catch (error) {
    next(error)
  }
}

const updateSaleAdmin = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  const saleId = req.params.id
  try {
    const sale = await service.updateSaleAdmin(saleId, req.body, files, req.user)
    return res.status(200).json(sale)
  } catch (error) {
    next(error)
  }
}

const updateSale = async (req, res, next) => {
  const saleId = req.params.id
  try {
    const sale = await service.updateSale(saleId, req.body, req.user)
    const ordersNew = await Promise.all(sale.orders.map(async order => {
      const orderNew = await orderDB.detail({query: {_id: order._id}, populate: ['student.ref', 'course.ref', 'voucher.ref']})
      return { ...orderNew.toJSON() }
    }))
    return res.status(201).json({
      ...sale.toJSON(),
      orders: ordersNew})
  } catch (error) {
    next(error)
  }
}

const detailSale = async (req, res, next) => {
  const saleId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = saleId
  } else {
    params.query = {
      _id: saleId
    }
  }

  try {
    const sale = await service.detailSale(params)
    return res.status(200).json(sale)
  } catch (error) {
    next(error)
  }
}

const deleteSale = async (req, res, next) => {
  const saleId = req.params.id
  try {
    const sale = await service.deleteSale(saleId, req.sale)
    return res.status(201).json(sale)
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
  listSales,
  searchSales,
  assessorSales,
  createSales,
  resetSale,
  updateSale,
  updateSaleOne,
  updateSaleAdmin,
  detailSale,
  deleteSale
}
