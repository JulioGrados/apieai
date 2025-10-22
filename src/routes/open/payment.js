'use strict'

const { Router } = require('express')
const Api = require('../../controllers/payments')

const router = new Router()

router.route('/payments').get(Api.listPayments)

module.exports = router
