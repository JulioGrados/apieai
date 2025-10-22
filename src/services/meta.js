'use strict'

const { metaDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listMetas = async params => {
  const metas = await metaDB.list(params)
  return metas
}

const createMeta = async (body, files, loggedUser) => {
  body = await saveFiles(body, files)
  const meta = await metaDB.create(body)
  return meta
}

const updateMeta = async (metaId, body, files, loggedUser) => {
  body = await saveFiles(body, files)
  const meta = await metaDB.update(metaId, body)
  return meta
}

const detailMeta = async params => {
  const meta = await metaDB.detail(params)
  return meta
}

const deleteMeta = async (metaId, loggedUser) => {
  const meta = await metaDB.remove(metaId)
  return meta
}

const countDocuments = async params => {
  const count = await metaDB.count(params)
  return count
}

const saveFiles = async (data, files) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/metas')
      if (label === 'fb.image') {
        data.fb.image = route
      } else if (label === 'tw.image') {
        data.tw.image = route
      } else if (label === 'opengraph') {
        data.og.image = route
      }
    }
  }
  return data
}

module.exports = {
  countDocuments,
  listMetas,
  createMeta,
  updateMeta,
  detailMeta,
  deleteMeta
}
