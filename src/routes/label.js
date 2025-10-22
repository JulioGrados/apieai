'use strict'

const { Router } = require('express')
const Api = require('../controllers/labels')

const router = new Router()

router.route('/labels/count').get(Api.countDocuments)

router
  .route('/labels')
  .get(Api.listLabels)
  .post(Api.createLabel)

router
  .route('/labels/:id')
  .get(Api.detailLabel)
  .put(Api.updateLabel)
  .delete(Api.deleteLabel)

module.exports = router
