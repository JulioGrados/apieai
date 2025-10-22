'use strict'

const { Router } = require('express')
const Api = require('../controllers/chat')

const router = new Router()

router.route('/chats/count').get(Api.countDocuments)

router
  .route('/chats')
  .get(Api.listChats)
  .post(Api.createChat)

router
  .route('/chats/:id')
  .get(Api.detailChat)
  .put(Api.updateChat)
  .delete(Api.deleteChat)

module.exports = router