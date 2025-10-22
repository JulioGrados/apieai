'use strict'

const { progressDB } = require('db/lib')

const listProgresses = async params => {
  const progresss = await progressDB.list(params)
  return progresss
}

const createProgress = async (body, loggedProgress) => {
  const progress = await progressDB.create(body)
  return progress
}

const updateProgress = async (progressId, body, loggedProgress) => {
  const progress = await progressDB.update(progressId, body)
  return progress
}

const detailProgress = async params => {
  const progress = await progressDB.detail(params)
  return progress
}

const deleteProgress = async (progressId, loggedProgress) => {
  const progress = await progressDB.remove(progressId)
  return progress
}

const countDocuments = async params => {
  const count = await progressDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listProgresses,
  createProgress,
  updateProgress,
  detailProgress,
  deleteProgress
}
