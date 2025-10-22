'use strict'

const { Router } = require('express')
const Api = require('../../controllers/test')

const router = new Router()

router.route('/test/main').get(Api.eventGoogleDrive)
// router.route('/migrate/testimonies').get(Api.migrateTestimonies)
router.route('/test/googledrive').get(Api.getMain)
router.route('/test/webhook').post(Api.webhook)
module.exports = router