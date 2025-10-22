'use strict'

const { Router } = require('express')
const Api = require('../../controllers/whatsapp')

const router = new Router() 

router
  .route('/whatsapp')
  .get(Api.verifyWebhook)
  .post(Api.eventWebhook)

router
  .route('/whatsapp/post')
  .get(Api.postMenssage)

module.exports = router