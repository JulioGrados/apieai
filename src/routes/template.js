'use strict'

const { Router } = require('express')
const Api = require('../controllers/templates')

const router = new Router()

router.route('/templates/count').get(Api.countDocuments)

router
  .route('/templates')
  .get(Api.listTemplates)
  .post(Api.createTemplate)

router
  .route('/templates/:id')
  .get(Api.detailTemplate)
  .put(Api.updateTemplate)
  .delete(Api.deleteTemplate)

module.exports = router
