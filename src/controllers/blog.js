'use strict'

const service = require('../services/blog')

const listBlogs = async (req, res) => {
  const blogs = await service.listBlogs(req.query)
  return res.status(200).json(blogs)
}

const createBlog = async (req, res, next) => {
  const body = JSON.parse(req.body.data)
  const file = req.files && req.files.image
  try {
    const blog = await service.createBlog(body, file, req.user)
    return res.status(201).json(blog)
  } catch (error) {
    next(error)
  }
}

const updateBlog = async (req, res, next) => {
  const blogId = req.params.id
  const body = JSON.parse(req.body.data)
  const file = req.files && req.files.image
  try {
    const blog = await service.updateBlog(
      blogId,
      body,
      file,
      req.user
    )
    return res.status(200).json(blog)
  } catch (error) {
    next(error)
  }
}

const detailBlog = async (req, res, next) => {
  const blogId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = blogId
  } else {
    params.query = {
      _id: blogId
    }
  }

  try {
    const blog = await service.detailBlog(params)
    return res.status(200).json(blog)
  } catch (error) {
    next(error)
  }
}

const detailOpenBlog = async (req, res, next) => {
  // const slug = req.params.slug
  // const params = req.query
  // console.log('slug', slug)
  // console.log('params', params)
  // if (params.query) {
  //   params.query.slug = slug
  // } else {
  //   params.query = {
  //     slug: slug
  //   }
  // }

  try {
    const blog = await service.detailBlog(req.query)
    return res.status(200).json(blog)
  } catch (error) {
    next(error)
  }
}

const deleteBlog = async (req, res, next) => {
  const blogId = req.params.id
  try {
    const blog = await service.deleteBlog(blogId, req.user)
    return res.status(201).json(blog)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listBlogs,
  createBlog,
  updateBlog,
  detailBlog,
  detailOpenBlog,
  deleteBlog
}
