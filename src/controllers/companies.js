'use strict'

const service = require('../services/company')

const listCompanies = async (req, res) => {
  const companies = await service.listCompanies(req.query)
  return res.status(200).json(companies)
}

const createCompany = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.image
  try {
    const company = await service.createCompany(body, file, req.user)
    return res.status(201).json(company)
  } catch (error) {
    console.log(error)
    next(error)
  }
}

const updateCompany = async (req, res, next) => {
  const companyId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.image
  try {
    const company = await service.updateCompany(companyId, body, file, req.user)
    return res.status(200).json(company)
  } catch (error) {
    next(error)
  }
}

const detailCompany = async (req, res, next) => {
  const companyId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = companyId
  } else {
    params.query = {
      _id: companyId
    }
  }

  try {
    const company = await service.detailCompany(params)
    return res.status(200).json(company)
  } catch (error) {
    next(error)
  }
}

const deleteCompany = async (req, res, next) => {
  const companyId = req.params.id
  try {
    const company = await service.deleteCompany(companyId, req.user)
    return res.status(201).json(company)
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
  listCompanies,
  createCompany,
  updateCompany,
  detailCompany,
  deleteCompany
}
