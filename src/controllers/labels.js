'use strict'

const service = require('../services/label')

const listLabels = async (req, res) => {
  const labels = await service.listLabels(req.query)
  return res.status(200).json(labels)
}

const createLabel = async (req, res, next) => {
  try {
    const label = await service.createLabel(req.body, req.user)
    return res.status(201).json(label)
  } catch (error) {
    next(error)
  }
}

const updateLabel = async (req, res, next) => {
  const labelId = req.params.id
  try {
    const label = await service.updateLabel(labelId, req.body, req.user)
    return res.status(200).json(label)
  } catch (error) {
    next(error)
  }
}

const detailLabel = async (req, res, next) => {
  const labelId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = labelId
  } else {
    params.query = {
      _id: labelId
    }
  }

  try {
    const label = await service.detailLabel(params)
    return res.status(200).json(label)
  } catch (error) {
    next(error)
  }
}

const deleteLabel = async (req, res, next) => {
  const labelId = req.params.id
  try {
    const label = await service.deleteLabel(labelId, req.user)
    return res.status(201).json(label)
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
  listLabels,
  createLabel,
  updateLabel,
  detailLabel,
  deleteLabel
}
