'use strict'

const { Router } = require('express')
const Api = require('../../controllers/moodle')

const router = new Router()

router.route('/moodle').post(Api.createCertificates)
// router.route('/migrate/testimonies').get(Api.migrateTestimonies)

module.exports = router
