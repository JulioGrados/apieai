'use strict'

const service = require('../services/confirmation')

const listConfirmations = async (req, res) => {
  const confirmations = await service.listConfirmations(req.query)
  return res.status(200).json(confirmations)
}

const listConfirmationsCourse = async (req, res) => {
  const confirmations = await service.listConfirmationsCourse(req.query)
  return res.status(200).json(confirmations)
}

const createConfirmation = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.image
  try {
    const testimony = await service.createConfirmation(body, file, req.user)
    return res.status(201).json(testimony)
  } catch (error) {
    next(error)
  }
}

const updateConfirmation = async (req, res, next) => {
  const testimonyId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.image
  try {
    const testimony = await service.updateConfirmation(
      testimonyId,
      body,
      file,
      req.user
    )
    return res.status(200).json(testimony)
  } catch (error) {
    next(error)
  }
}

const detailConfirmation = async (req, res, next) => {
  const testimonyId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = testimonyId
  } else {
    params.query = {
      _id: testimonyId
    }
  }

  try {
    const testimony = await service.detailConfirmation(params)
    return res.status(200).json(testimony)
  } catch (error) {
    next(error)
  }
}

const detailOpenConfirmation = async (req, res, next) => {
  const confirmationId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = confirmationId
  } else {
    params.query = {
      _id: confirmationId
    }
  }

  try {
    const confirmation = await service.detailConfirmation(params)
    return res.status(200).json(confirmation)
  } catch (error) {
    next(error)
  }
}

const detailOpenActivation = async (req, res, next) => {
  const confirmationId = req.params.id
  try {
    const confirmation = await service.detailOpenActivation(confirmationId, req.body, req.user)
    return res.status(200).json(confirmation)
  } catch (error) {
    next(error)
  }
}

const deleteConfirmation = async (req, res, next) => {
  const testimonyId = req.params.id
  try {
    const testimony = await service.deleteConfirmation(testimonyId, req.user)
    return res.status(201).json(testimony)
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
  listConfirmations,
  listConfirmationsCourse,
  createConfirmation,
  updateConfirmation,
  detailConfirmation,
  detailOpenConfirmation,
  detailOpenActivation,
  deleteConfirmation
}
