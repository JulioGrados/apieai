'use strict'

const { Router } = require('express')
const Api = require('../controllers/metas')

const router = new Router()

router.route('/metas/count').get(Api.countDocuments)

router
  .route('/metas')
  .get(Api.listMetas)
  .post(Api.createMeta)

router
  .route('/metas/:id')
  .get(Api.detailMeta)
  .put(Api.updateMeta)
  .delete(Api.deleteMeta)

module.exports = router
