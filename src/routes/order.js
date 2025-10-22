'use strict'

const { Router } = require('express')
const Api = require('../controllers/orders')

const router = new Router()

router.route('/orders/count').get(Api.countDocuments)

router
  .route('/orders')
  .get(Api.listOrders)
  .post(Api.createOrder)

router
  .route('/orders/crm')
  .get(Api.assessorOrders)

router
  .route('/orders/:id')
  .get(Api.detailOrder)
  .put(Api.updateOrder)
  .delete(Api.deleteOrder)

router
  .route('/orders/admin/:id')
  .put(Api.updateOrderAdmin)

module.exports = router
