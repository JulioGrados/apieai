'use strict'

const { Router } = require('express')
const Api = require('../controllers/exam')

const router = new Router()

router.route('/exams/count').get(Api.countDocuments)

router
  .route('/exams')
  .get(Api.listExams)
  .post(Api.createExam)

router
  .route('/exams/:id')
  .get(Api.detailExam)
  .put(Api.updateExam)
  .delete(Api.deleteExam)

module.exports = router
