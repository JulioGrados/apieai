'use strict'

const { Router } = require('express')
const Api = require('../controllers/timelines')

const router = new Router()

router.route('/timelines/count').get(Api.countDocuments)

router
  .route('/timelines')
  .get(Api.listTimelines)
  .post(Api.createTimeline)

router
  .route('/timelines/update')
  .post(Api.crupdTimeline)

router
  .route('/timelines/:id')
  .get(Api.detailTimeline)
  .put(Api.updateTimeline)
  .delete(Api.deleteTimeline)

module.exports = router
