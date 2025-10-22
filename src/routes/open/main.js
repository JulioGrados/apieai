'use strict'

const { Router } = require('express')
const Api = require('../../controllers/test')

const router = new Router()

router.route('/').post(Api.getMain)
router.route('/balance').get(Api.getBalance)
// router.route('/migrate/testimonies').get(Api.migrateTestimonies)

module.exports = router