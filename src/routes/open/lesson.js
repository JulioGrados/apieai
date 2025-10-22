'use strict'

const { Router } = require('express')
const Api = require('../../controllers/lesson')

const router = new Router()

router.route('/lessons/detail').get(Api.detailLesson)

module.exports = router
