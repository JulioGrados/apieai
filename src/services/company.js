'use strict'

const { companyDB } = require('db/lib')
const { saveFile } = require('utils/files/save')

const listCompanies = async params => {
  console.log('--------------------------------------------------------')
  console.log('COMPANY')
  console.log('--------------------------------------------------------')
  const companies = await companyDB.list(params)
  return companies
}

const createCompany = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/companies')
    body.image = route
  }
  const count = await companyDB.count({})
  body.increase = (count ? count : 0) + 1
  const company = await companyDB.create(body)
  return company
}

const updateCompany = async (companyId, body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/companies')
    body.image = route
  }
  const company = await companyDB.update(companyId, body)
  return company
}

const detailCompany = async params => {
  const company = await companyDB.detail(params)
  return company
}

const deleteCompany = async (companyId, loggedUser) => {
  const company = await companyDB.remove(companyId)
  return company
}

const countDocuments = async params => {
  const count = await companyDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCompanies,
  createCompany,
  updateCompany,
  detailCompany,
  deleteCompany
}
