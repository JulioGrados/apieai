'use strict'

const { Router } = require('express')
const Api = require('../controllers/companies')

const router = new Router()

router.route('/companies/count').get(Api.countDocuments)

router
  .route('/companies')
  .get(Api.listCompanies)
  .post(Api.createCompany)

router
  .route('/companies/:id')
  .get(Api.detailCompany)
  .put(Api.updateCompany)
  .delete(Api.deleteCompany)

module.exports = router
