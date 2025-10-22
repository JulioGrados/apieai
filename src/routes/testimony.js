'use strict'

const { Router } = require('express')
const Api = require('../controllers/testimonies')

const router = new Router()

router.route('/testimonies/count').get(Api.countDocuments)

router
  .route('/testimonies')
  .get(Api.listTestimonies)
  .post(Api.createTestimony)

router
  .route('/testimonies/:id')
  .get(Api.detailTestimony)
  .put(Api.updateTestimony)
  .delete(Api.deleteTestimony)

module.exports = router
