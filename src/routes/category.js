'use strict'

const { Router } = require('express')
const Api = require('../controllers/categories')

const router = new Router()

router.route('/categories/count').get(Api.countDocuments)

router
  .route('/categories')
  .get(Api.listCategories)
  .post(Api.createCategory)

router
  .route('/categories/:id')
  .get(Api.detailCategory)
  .put(Api.updateCategory)
  .delete(Api.deleteCategory)

module.exports = router
