'use strict'

const { Router } = require('express')
const Api = require('../../controllers/labels')

const router = new Router()

router.route('/labels').get(Api.listLabels)

module.exports = router
