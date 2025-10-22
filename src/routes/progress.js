'use strict'

const { Router } = require('express')
const Api = require('../controllers/progresses')

const router = new Router()

router.route('/progresses/count').get(Api.countDocuments)

router
  .route('/progresses')
  .get(Api.listProgresses)
  .post(Api.createProgress)

router
  .route('/progresses/:id')
  .get(Api.detailProgress)
  .put(Api.updateProgress)
  .delete(Api.deleteProgress)

module.exports = router
