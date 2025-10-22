'use strict'

const { Router } = require('express')
const Api = require('../controllers/agreement')

const router = new Router()

router.route('/agreements/count').get(Api.countDocuments)

router
  .route('/agreements')
  .get(Api.listAgreements)
  .post(Api.createAgreement)

router
  .route('/agreements/:id')
  .get(Api.detailAgreement)
  .put(Api.updateAgreement)
  .delete(Api.deleteAgreement)

module.exports = router
