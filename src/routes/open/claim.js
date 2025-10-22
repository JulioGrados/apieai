'use strict'

const { Router } = require('express')
const Api = require('../../controllers/claim')

const router = new Router()

router.route('/claims').post(Api.createClaim)

module.exports = router
