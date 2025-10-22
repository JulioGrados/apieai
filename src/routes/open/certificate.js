'use strict'

const { Router } = require('express')
const Api = require('../../controllers/certificates')

const router = new Router()

router.route('/certificates/detail').get(Api.detailCertificateOpen)

module.exports = router
