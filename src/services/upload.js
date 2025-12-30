'use strict'

const { uploadDB } = require('db/lib')

const listUploads = async params => {
  const uploads = await uploadDB.list(params)
  return uploads
}

const createUpload = async (body, loggedUpload) => {
  const upload = await uploadDB.create(body)
  return upload
}

const updateUpload = async (uploadId, body, loggedUpload) => {
  const upload = await uploadDB.update(uploadId, body)
  return upload
}

const detailUpload = async params => {
  const upload = await uploadDB.detail(params)
  return upload
}

const deleteUpload = async (uploadId, loggedUpload) => {
  const upload = await uploadDB.remove(uploadId)
  return upload
}

const countDocuments = async params => {
  const count = await uploadDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listUploads,
  createUpload,
  updateUpload,
  detailUpload,
  deleteUpload
}
