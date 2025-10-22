'use strict'

const { Router } = require('express')
const Api = require('../controllers/timetables')

const router = new Router()

router.route('/timetables/count').get(Api.countDocuments)

router
  .route('/timetables')
  .get(Api.listTimetables)
  .post(Api.createTimetable)

router
  .route('/timetables/:id')
  .get(Api.detailTimetable)
  .put(Api.updateTimetable)
  .delete(Api.deleteTimetable)

module.exports = router
