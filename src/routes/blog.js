'use strict'

const { Router } = require('express')
const Api = require('../controllers/blog')

const router = new Router()

router.route('/blogs/count').get(Api.countDocuments)

router
  .route('/blogs')
  .get(Api.listBlogs)
  .post(Api.createBlog)

router
  .route('/blogs/:id')
  .get(Api.detailBlog)
  .put(Api.updateBlog)
  .delete(Api.deleteBlog)

module.exports = router
