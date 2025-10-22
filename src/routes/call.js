'use strict'

const { Router } = require('express')
const Api = require('../controllers/calls')

const router = new Router()

router.route('/calls/count').get(Api.countDocuments)

router
  .route('/calls')
  .get(Api.listCalls)
  .post(Api.createCall)

router
  .route('/calls/:id')
  .get(Api.detailCall)
  .put(Api.updateCall)
  .delete(Api.deleteCall)

module.exports = router
