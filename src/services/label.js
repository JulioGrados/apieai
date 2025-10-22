'use strict'

const { labelDB } = require('db/lib')

const listLabels = async params => {
  const labels = await labelDB.list(params)
  return labels
}

const createLabel = async (body, labelgedUser) => {
  const label = await labelDB.create(body)
  return label
}

const updateLabel = async (labelId, body, labelgedUser) => {
  const label = await labelDB.update(labelId, body)
  return label
}

const detailLabel = async params => {
  const label = await labelDB.detail(params)
  return label
}

const deleteLabel = async (labelId, labelgedUser) => {
  const label = await labelDB.remove(labelId)
  return label
}

const countDocuments = async params => {
  const count = await labelDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listLabels,
  createLabel,
  updateLabel,
  detailLabel,
  deleteLabel
}
