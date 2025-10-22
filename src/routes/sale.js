'use strict'

const { Router } = require('express')
const Api = require('../controllers/sale')

const router = new Router()

router.route('/sales/count').get(Api.countDocuments)

router
  .route('/sales')
  .get(Api.listSales)
  .post(Api.createSales)

router
  .route('/sales/search')
  .get(Api.searchSales)

router
  .route('/sales/reset')
  .post(Api.resetSale)

router
  .route('/sales/assessor')
  .get(Api.assessorSales)

router
  .route('/sales/admin/:id')
  .put(Api.updateSaleOne)

router
  .route('/sales/reset/:id')
  .put(Api.updateSaleAdmin) 

router
  .route('/sales/:id')
  .get(Api.detailSale)
  .put(Api.updateSale)
  .delete(Api.deleteSale)

module.exports = router
