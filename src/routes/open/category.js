'use strict'

const { Router } = require('express')
const Api = require('../../controllers/categories')

const router = new Router()

router.route('/categories').get(Api.listCategories)

module.exports = router
