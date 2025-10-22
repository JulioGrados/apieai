'use strict'

const { Router } = require('express')
const Api = require('../../controllers/migrations')

const router = new Router()

router.route('/migrations/deals').post(Api.migrateDealsUsers)

module.exports = router
