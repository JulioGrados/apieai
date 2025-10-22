'use strict'

const { Router } = require('express')
const Api = require('../controllers/message')

const router = new Router()

router.route('/messages/count').get(Api.countDocuments)

router
  .route('/messages')
  .get(Api.listMessages)
  .post(Api.createMessage)

router
  .route('/messages/:id')
  .get(Api.detailMessage)
  .put(Api.updateMessage)
  .delete(Api.deleteMessage)

module.exports = router