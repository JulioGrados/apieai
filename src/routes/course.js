'use strict'

const { Router } = require('express')
const Api = require('../controllers/courses')

const router = new Router()

router.route('/courses/count').get(Api.countDocuments)

router
  .route('/courses')
  .get(Api.listCourses)
  .post(Api.createCourse)

router
  .route('/courses/:id')
  .get(Api.detailCourseFirst)
  .put(Api.updateCourse)
  .delete(Api.deleteCourse)

router
  .route('/courses/price')
  .post(Api.priceCourses)

module.exports = router
