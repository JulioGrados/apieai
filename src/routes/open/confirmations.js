'use strict'

const { Router } = require('express')
const Api = require('../../controllers/confirmation')

const router = new Router()

router.route('/confirmations/detail/:id').get(Api.detailOpenConfirmation)
router.route('/confirmations/activation/:id').put(Api.detailOpenActivation)

module.exports = router