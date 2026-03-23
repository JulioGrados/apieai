'use strict'

const { Router } = require('express')
const Api = require('../../controllers/blog')

const router = new Router()

router.route('/blogs').get(Api.listBlogs)

router.route('/blogs/detail').get(Api.detailOpenBlog)

module.exports = router
