'use strict'

const { Router } = require('express')
const Api = require('../controllers/send')

const router = new Router()

router.route('/send/count').get(Api.countDocuments)

router
  .route('/send')
  .get(Api.listSends)
  .post(Api.createSend)

router
  .route('/send/:id')
  .get(Api.detailSend)
  .put(Api.updateSend)
  .delete(Api.deleteSend)

module.exports = router
