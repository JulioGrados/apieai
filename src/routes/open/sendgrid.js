'use strict'

const { Router } = require('express')
const Api = require('../../controllers/sendgrid')

const router = new Router()

router.route('/sendgrid').post(Api.eventWebhook)

module.exports = router
