'use strict'

const { Router } = require('express')
const Api = require('../../controllers/anura')

const router = new Router()

router.route('/anura').post(Api.eventWebhook)
router.route('/anura/incoming').post(Api.incomingWebhook)

module.exports = router
