'use strict'

const { Router } = require('express')
const Api = require('../../controllers/agreement')

const router = new Router()

router
  .route('/agreements')
  .get(Api.listAgreements)

router
  .route('/agreements/detail')
  .get(Api.detailOpenAgreement)

module.exports = router
