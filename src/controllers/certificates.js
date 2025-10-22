'use strict'

const service = require('../services/certificate')

const listCertificates = async (req, res) => {
  const certificates = await service.listCertificates(req.query)
  return res.status(200).json(certificates)
}

const listDealAgreements = async (req, res, next) => {
  const params = JSON.parse(req.query.query)
  try {
    const certificates = await service.listDealAgreements(params, req.user)
    return res.status(200).json(certificates)
  } catch (error) {
    next(error)
  }
}

const createAdminCertificate = async (req, res, next) => {
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const certificate = await service.createAdminCertificate(body, files, req.user)
    return res.status(201).json(certificate)
  } catch (error) {
    next(error)
  }
}

const updateAdminCertificate = async (req, res, next) => {
  const certificateId = req.params.id
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const certificate = await service.updateAdminCertificate(certificateId, body, files, req.user)
    return res.status(200).json(certificate)
  } catch (error) {
    next(error)
  }
}


const createCertificate = async (req, res, next) => {
  try {
    const certificate = await service.createCertificate(req.body, req.user)
    return res.status(201).json(certificate)
  } catch (error) {
    next(error)
  }
}

const updateCertificate = async (req, res, next) => {
  const certificateId = req.params.id
  try {
    const certificate = await service.updateCertificate(
      certificateId,
      req.body,
      req.user
    )
    return res.status(200).json(certificate)
  } catch (error) {
    next(error)
  }
}

const detailCertificate = async (req, res, next) => {
  const certificateId = req.params.id
  const params = req.query
  
  if (params.query) {
    params.query._id = certificateId
  } else {
    params.query = {
      _id: certificateId
    }
  }

  try {
    const certificate = await service.detailCertificate(params)
    return res.status(200).json(certificate)
  } catch (error) {
    next(error)
  }
}

const detailCertificateOpen = async (req, res, next) => {
  const certificateId = req.params.id
  const params = req.query
  if (certificateId) {
    if (params.query) {
      params.query._id = certificateId
    } else {
      params.query = {
        _id: certificateId
      }
    }
  }

  try {
    const certificate = await service.detailCertificateOpen(params)
    return res.status(200).json(certificate)
  } catch (error) {
    next(error)
  }
}

const deleteCertificate = async (req, res, next) => {
  const certificateId = req.params.id
  try {
    const certificate = await service.deleteCertificate(certificateId, req.user)
    return res.status(201).json(certificate)
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
  listCertificates,
  listDealAgreements,
  createCertificate,
  createAdminCertificate,
  updateAdminCertificate,
  updateCertificate,
  detailCertificate,
  detailCertificateOpen,
  deleteCertificate
}
