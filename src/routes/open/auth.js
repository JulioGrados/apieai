'use strict'

const { Router } = require('express')
const Api = require('../../controllers/auth')

const router = new Router()

router.route('/auth/login').post(Api.loginUser)

module.exports = router
