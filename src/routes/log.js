'use strict'

const { Router } = require('express')
const Api = require('../controllers/logs')

const router = new Router()

router.route('/logs/count').get(Api.countDocuments)

router
  .route('/logs')
  .get(Api.listLogs)
  .post(Api.createLog)

router
  .route('/logs/:id')
  .get(Api.detailLog)
  .put(Api.updateLog)
  .delete(Api.deleteLog)

module.exports = router
