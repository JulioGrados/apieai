'use strict'

const { categoryDB } = require('db/lib')
const { saveFile } = require('utils/files/save')

const listCategories = async params => {
  const categories = await categoryDB.list(params)
  return categories
}

const createCategory = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/categories')
    body.image = route
  }
  const category = await categoryDB.create(body)
  return category
}

const updateCategory = async (categoryId, body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/categories')
    body.image = route
  }
  const category = await categoryDB.update(categoryId, body)
  return category
}

const detailCategory = async params => {
  const category = await categoryDB.detail(params)
  return category
}

const deleteCategory = async (categoryId, loggedUser) => {
  const category = await categoryDB.remove(categoryId)
  return category
}

const countDocuments = async params => {
  const count = await categoryDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCategories,
  createCategory,
  updateCategory,
  detailCategory,
  deleteCategory
}
