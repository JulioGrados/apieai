'use strict'

const { Router } = require('express')
const Api = require('../controllers/chapter')

const router = new Router()

router.route('/chapters/count').get(Api.countDocuments)

router
  .route('/chapters')
  .get(Api.listChapters)
  .post(Api.createChapter)

router
  .route('/chapters/:id')
  .get(Api.detailChapter)
  .put(Api.updateChapter)
  .delete(Api.deleteChapter)

module.exports = router
