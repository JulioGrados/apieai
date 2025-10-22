'use strict'

const { templateDB } = require('db/lib')

const listTemplates = async params => {
  const templates = await templateDB.list(params)
  return templates
}

const createTemplate = async (body, loggedUser) => {
  const template = await templateDB.create(body)
  return template
}

const updateTemplate = async (templateId, body, loggedUser) => {
  const template = await templateDB.update(templateId, body)
  return template
}

const detailTemplate = async params => {
  const template = await templateDB.detail(params)
  return template
}

const deleteTemplate = async (templateId, loggedUser) => {
  const template = await templateDB.remove(templateId)
  return template
}

const countDocuments = async params => {
  const count = await templateDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listTemplates,
  createTemplate,
  updateTemplate,
  detailTemplate,
  deleteTemplate
}
