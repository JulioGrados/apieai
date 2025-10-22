'use strict'

const service = require('../services/template')

const listTemplates = async (req, res) => {
  const templates = await service.listTemplates(req.query)
  return res.status(200).json(templates)
}

const createTemplate = async (req, res, next) => {
  try {
    const template = await service.createTemplate(req.body, req.user)
    return res.status(201).json(template)
  } catch (error) {
    next(error)
  }
}

const updateTemplate = async (req, res, next) => {
  const templateId = req.params.id
  try {
    const template = await service.updateTemplate(
      templateId,
      req.body,
      req.user
    )
    return res.status(200).json(template)
  } catch (error) {
    next(error)
  }
}

const detailTemplate = async (req, res, next) => {
  const templateId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = templateId
  } else {
    params.query = {
      _id: templateId
    }
  }

  try {
    const template = await service.detailTemplate(params)
    return res.status(200).json(template)
  } catch (error) {
    next(error)
  }
}

const deleteTemplate = async (req, res, next) => {
  const templateId = req.params.id
  try {
    const template = await service.deleteTemplate(templateId, req.user)
    return res.status(201).json(template)
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
  listTemplates,
  createTemplate,
  updateTemplate,
  detailTemplate,
  deleteTemplate
}
