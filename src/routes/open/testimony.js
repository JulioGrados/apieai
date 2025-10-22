'use strict'

const { Router } = require('express')
const Api = require('../../controllers/testimonies')

const router = new Router()

router.route('/testimonies').get(Api.listTestimonies)

router.route('/testimonies/course').get(Api.listTestimoniesCourse)

module.exports = router
