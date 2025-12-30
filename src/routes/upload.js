'use strict'

const { Router } = require('express')
const Api = require('../controllers/upload')

const router = new Router()

router.route('/uploads/count').get(Api.countDocuments)

router
  .route('/uploads')
  .get(Api.listUploads)
  .post(Api.createUpload)

router
  .route('/uploads/:id')
  .get(Api.detailUpload)
  .put(Api.updateUpload)
  .delete(Api.deleteUpload)

module.exports = router
