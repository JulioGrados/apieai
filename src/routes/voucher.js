'use strict'

const { Router } = require('express')
const Api = require('../controllers/vouchers')

const router = new Router()

router.route('/vouchers/count').get(Api.countDocuments)

router
  .route('/vouchers')
  .get(Api.listVouchers)
  .post(Api.createVoucher)

router
  .route('/vouchers/search')
  .get(Api.getOneVoucher)

router
  .route('/vouchers/:id')
  .get(Api.detailVoucher)
  .put(Api.updateVoucher)
  .delete(Api.deleteVoucher)

router
  .route('/vouchers/admin/:id')
  .get(Api.detailAdminVoucher)
  .put(Api.updateAdminVoucher)
  // .delete(Api.deleteVoucher)

module.exports = router
