'use strict'

const { Router } = require('express')
const Api = require('../controllers/question')

const router = new Router()

router.route('/questions/count').get(Api.countDocuments)

router
  .route('/questions')
  .get(Api.listQuestions)
  .post(Api.createQuestion)

router
  .route('/questions/:id')
  .get(Api.detailQuestion)
  .put(Api.updateQuestion)
  .delete(Api.deleteQuestion)

module.exports = router
