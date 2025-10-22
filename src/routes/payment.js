'use strict'

const { Router } = require('express')
const Api = require('../controllers/payments')

const router = new Router()

router.route('/payments/count').get(Api.countDocuments)

router
  .route('/payments')
  .get(Api.listPayments)
  .post(Api.createPayment)

router
  .route('/payments/:id')
  .get(Api.detailPayment)
  .put(Api.updatePayment)
  .delete(Api.deletePayment)

module.exports = router
