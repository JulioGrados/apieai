'use strict'

const { Router } = require('express')
const Api = require('../../controllers/contacts')

const router = new Router()

router.route('/contacts').post(Api.createContact)

module.exports = router
