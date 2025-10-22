'use strict'

const { Router } = require('express')
const Api = require('../controllers/receipt')

const router = new Router()

router.route('/receipts/count').get(Api.countDocuments)

router
  .route('/receipts')
  .get(Api.listReceipts)
  .post(Api.createReceipt)

router
  .route('/receipts/:id')
  .get(Api.detailReceipt)
  .put(Api.updateReceipt)
  .delete(Api.deleteReceipt)

router
  .route('/receipts/admin/:id')
  .get(Api.detailAdminReceipt)
  .put(Api.updateAdminReceipt)
  .delete(Api.deleteAdminReceipt)

router
  .route('/receipts/update/:id')
  .put(Api.onlyUpdateReceipt)

router
  .route('/receipts/note/:id')
  .put(Api.noteAdminReceipt)

router
  .route('/receipts/facture')
  .post(Api.sendFacture)

router
  .route('/receipts/facture/:id')
  .put(Api.createFacture)

module.exports = router
