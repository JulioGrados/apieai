'use strict'

const { Router } = require('express')
const Api = require('../../controllers/charge')

const router = new Router()

router.route('/charge/dlocal').post(Api.createPaymentdLocal)
router.route('/charge/detail').get(Api.detailChargeOpen)
router.route('/charge/notification').post(Api.notificationChargeOpen)

module.exports = router
