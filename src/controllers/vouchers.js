'use strict'

const service = require('../services/voucher')

const listVouchers = async (req, res) => {
  const vouchers = await service.listVouchers(req.query)
  return res.status(200).json(vouchers)
}

const createVoucher = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  try {
    const voucher = await service.createVoucher(body, files, req.user)
    // console.log('voucher', voucher)
    return res.status(201).json(voucher)
  } catch (error) {
    next(error)
  }
}

const updateVoucher = async (req, res, next) => {
  const voucherId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files

  // console.log('body', body)
  try {
    const voucher = await service.updateVoucher(
      voucherId,
      body,
      files,
      req.user
    )
    return res.status(200).json(voucher)
  } catch (error) {
    next(error)
  }
}

const updateAdminVoucher = async (req, res, next) => {
  const voucherId = req.params.id
  
  try {
    const voucher = await service.updateAdminVoucher(
      voucherId,
      req.body,
      req.user
    )
    return res.status(200).json(voucher)
  } catch (error) {
    next(error)
  }
}

const detailVoucher = async (req, res, next) => {
  const voucherId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = voucherId
  } else {
    params.query = {
      _id: voucherId
    }
  }

  try {
    const voucher = await service.detailVoucher(params)
    return res.status(200).json(voucher)
  } catch (error) {
    next(error)
  }
}

const detailAdminVoucher = async (req, res, next) => {
  const voucherId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = voucherId
  } else {
    params.query = {
      _id: voucherId
    }
  }

  try {
    const voucher = await service.detailAdminVoucher(params, voucherId)
    return res.status(200).json(voucher)
  } catch (error) {
    next(error)
  }
}

const getOneVoucher = async (req, res, next) => {
  const params = req.query
  try {
    const voucher = await service.detailVoucher(params)
    return res.status(200).json(voucher)
  } catch (error) {
    next(error)
  }
}

const deleteVoucher = async (req, res, next) => {
  const voucherId = req.params.id
  try {
    const voucher = await service.deleteVoucher(voucherId, req.user)
    return res.status(201).json(voucher)
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
  listVouchers,
  createVoucher,
  updateVoucher,
  updateAdminVoucher,
  detailVoucher,
  detailAdminVoucher,
  getOneVoucher,
  deleteVoucher
}
