'use strict'

const { Router } = require('express')
const Api = require('../../controllers/paycash')

const router = new Router()

router.route('/paycash').post(Api.eventWebhook)

module.exports = router
