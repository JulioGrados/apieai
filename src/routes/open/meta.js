'use strict'

const { Router } = require('express')
const Api = require('../../controllers/metas')

const router = new Router()

router.route('/metas').get(Api.listMetas)
router.route('/metas/detail').get(Api.detailMeta)

module.exports = router
