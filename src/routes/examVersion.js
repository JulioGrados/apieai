'use strict'

const { Router } = require('express')
const Api = require('../controllers/examVersion')

const router = new Router()

router.route('/examversions/count').get(Api.countDocuments)

router
  .route('/examversions')
  .get(Api.listExamVersions)
  .post(Api.createExamVersion)

router
  .route('/examversions/:id')
  .get(Api.detailExamVersion)
  .put(Api.updateExamVersion)
  .delete(Api.deleteExamVersion)

router
  .route('/exams/:examId/favorite/:versionId')
  .put(Api.setFavoriteVersion)

router
  .route('/examversions/:versionId/edit')
  .put(Api.editVersion)

module.exports = router
