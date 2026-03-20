'use strict'

const { blogDB } = require('db/lib')
const { saveFile } = require('utils/files/save')

const listBlogs = async params => {
  const blogs = await blogDB.list(params)
  return blogs
}

const createBlog = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/blogs')
    body.image = route
  }
  const blog = await blogDB.create(body)
  return blog
}

const updateBlog = async (blogId, body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/blogs')
    body.image = route
  }
  const blog = await blogDB.update(blogId, body)
  return blog
}

const detailBlog = async params => {
  const blog = await blogDB.detail(params)
  return blog
}

const deleteBlog = async (blogId, loggedUser) => {
  const blog = await blogDB.remove(blogId)
  return blog
}

const countDocuments = async params => {
  const count = await blogDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listBlogs,
  createBlog,
  updateBlog,
  detailBlog,
  deleteBlog
}
