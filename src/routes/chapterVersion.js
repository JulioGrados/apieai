'use strict'

const { Router } = require('express')
const Api = require('../controllers/chapterversion')

const router = new Router()

router.route('/chapterversions/count').get(Api.countDocuments)

router
  .route('/chapterversions')
  .get(Api.listChapterVersions)
  .post(Api.createChapterVersion)

router
  .route('/chapterversions/:id')
  .get(Api.detailChapterVersion)
  .put(Api.updateChapterVersion)
  .delete(Api.deleteChapterVersion)

router
  .route('/chapters/:chapterId/favorite/:versionId')
  .put(Api.setFavoriteVersion)

router
  .route('/chapterversions/:versionId/edit')
  .put(Api.editVersion)

module.exports = router
