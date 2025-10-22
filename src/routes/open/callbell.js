'use strict'

const { Router } = require('express')

const Api = require('../../controllers/callbell')

const router = new Router()

router.route('/callbell').post(Api.eventWebhook)

module.exports = router