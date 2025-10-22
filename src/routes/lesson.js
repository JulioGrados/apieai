'use strict'

const { Router } = require('express')
const Api = require('../controllers/lesson')

const router = new Router()

router.route('/lessons/count').get(Api.countDocuments)

router
  .route('/lessons')
  .get(Api.listLessons)
  .post(Api.createLesson)

router
  .route('/lessons/:id')
  .get(Api.detailLesson)
  .put(Api.updateLesson)
  .delete(Api.deleteLesson)

module.exports = router
