'use strict'

const service = require('../services/testimony')

const listTestimonies = async (req, res) => {
  const testimonies = await service.listTestimonies(req.query)
  return res.status(200).json(testimonies)
}

const listTestimoniesCourse = async (req, res) => {
  const testimonies = await service.listTestimoniesCourse(req.query)
  return res.status(200).json(testimonies)
}

const createTestimony = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.image
  try {
    const testimony = await service.createTestimony(body, file, req.user)
    return res.status(201).json(testimony)
  } catch (error) {
    next(error)
  }
}

const updateTestimony = async (req, res, next) => {
  const testimonyId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.image
  try {
    const testimony = await service.updateTestimony(
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

const detailTestimony = async (req, res, next) => {
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
    const testimony = await service.detailTestimony(params)
    return res.status(200).json(testimony)
  } catch (error) {
    next(error)
  }
}

const deleteTestimony = async (req, res, next) => {
  const testimonyId = req.params.id
  try {
    const testimony = await service.deleteTestimony(testimonyId, req.user)
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
  listTestimonies,
  listTestimoniesCourse,
  createTestimony,
  updateTestimony,
  detailTestimony,
  deleteTestimony
}
