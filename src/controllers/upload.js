'use strict'

const service = require('../services/upload')

const listUploads = async (req, res) => {
  const uploads = await service.listUploads(req.query)
  return res.status(200).json(uploads)
}

const createUpload = async (req, res, next) => {
  try {
    const upload = await service.createUpload(req.body, req.upload)
    return res.status(201).json(upload)
  } catch (error) {
    next(error)
  }
}

const updateUpload = async (req, res, next) => {
  const uploadId = req.params.id
  try {
    const upload = await service.updateUpload(
      uploadId,
      req.body,
      req.upload
    )
    return res.status(200).json(upload)
  } catch (error) {
    next(error)
  }
}

const detailUpload = async (req, res, next) => {
  const uploadId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = uploadId
  } else {
    params.query = {
      _id: uploadId
    }
  }

  try {
    const upload = await service.detailUpload(params)
    return res.status(200).json(upload)
  } catch (error) {
    next(error)
  }
}

const deleteUpload = async (req, res, next) => {
  const uploadId = req.params.id
  try {
    const upload = await service.deleteUpload(uploadId, req.upload)
    return res.status(201).json(upload)
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
  listUploads,
  createUpload,
  updateUpload,
  detailUpload,
  deleteUpload
}
