'use strict'

const service = require('../services/agreement')

const listAgreements = async (req, res) => {
  const agreements = await service.listAgreements(req.query)
  return res.status(200).json(agreements)
}

const createAgreement = async (req, res, next) => {
  const body = JSON.parse(req.body.data)
  const file = req.files && req.files.image
  try {
    const agreement = await service.createAgreement(body, file, req.user)
    return res.status(201).json(agreement)
  } catch (error) {
    next(error)
  }
}

const updateAgreement = async (req, res, next) => {
  const agreementId = req.params.id
  const body = JSON.parse(req.body.data)
  const file = req.files && req.files.image
  try {
    const agreement = await service.updateAgreement(
      agreementId,
      body,
      file,
      req.user
    )
    return res.status(200).json(agreement)
  } catch (error) {
    next(error)
  }
}

const detailAgreement = async (req, res, next) => {
  const agreementId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = agreementId
  } else {
    params.query = {
      _id: agreementId
    }
  }

  try {
    const agreement = await service.detailAgreement(params)
    return res.status(200).json(agreement)
  } catch (error) {
    next(error)
  }
}

const detailOpenAgreement = async (req, res, next) => {
  // const slug = req.params.slug
  // const params = req.query
  // console.log('slug', slug)
  // console.log('params', params)
  // if (params.query) {
  //   params.query.slug = slug
  // } else {
  //   params.query = {
  //     slug: slug
  //   }
  // }

  try {
    const agreement = await service.detailAgreement(req.query)
    return res.status(200).json(agreement)
  } catch (error) {
    next(error)
  }
}

const deleteAgreement = async (req, res, next) => {
  const agreementId = req.params.id
  try {
    const agreement = await service.deleteAgreement(agreementId, req.user)
    return res.status(201).json(agreement)
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
  listAgreements,
  createAgreement,
  updateAgreement,
  detailAgreement,
  detailOpenAgreement,
  deleteAgreement
}
