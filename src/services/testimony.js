'use strict'

const { testimonyDB } = require('db/lib')
const { saveFile } = require('utils/files/save')

const listTestimonies = async params => {
  console.log(params)
  const testimonies = await testimonyDB.list(params)
  return testimonies
}

const createTestimony = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/testimonies')
    body.image = route
  }
  const testimony = await testimonyDB.create(body)
  return testimony
}

const listTestimoniesCourse = async ({ courseId, categoryId }) => {
  let testimonies = []
  const params = {
    query: {
      status: 'Visible',
      'course.ref': courseId
    },
    limit: 4,
    populate: ['linked.ref', 'course.ref']
  }
  const testimoniesCourse = await testimonyDB.list(params)
  if (testimoniesCourse.length < 4) {
    const params = {
      query: {
        status: 'Visible',
        'course.category.ref': categoryId,
        _id: {
          $nin: testimoniesCourse.map(item => item._id)
        }
      },
      limit: 4 - testimoniesCourse.length,
      populate: ['linked.ref', 'course.ref']
    }
    const testimoniesCategory = await testimonyDB.list(params)
    testimonies = [...testimoniesCourse, ...testimoniesCategory]
    if (testimonies.length < 4) {
      const params = {
        query: {
          _id: {
            $nin: testimonies.map(item => item._id)
          },
          status: 'Visible'
        },
        limit: 4 - testimonies.length,
        populate: ['linked.ref', 'course.ref']
      }
      const testimoniesGeneral = await testimonyDB.list(params)
      testimonies = [...testimonies, ...testimoniesGeneral]
    }
  } else {
    testimonies = testimoniesCourse
  }

  return testimonies
}

const updateTestimony = async (testimonyId, body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/testimonies')
    body.image = route
  }
  const testimony = await testimonyDB.update(testimonyId, body)
  return testimony
}

const detailTestimony = async params => {
  const testimony = await testimonyDB.detail(params)
  return testimony
}

const deleteTestimony = async (testimonyId, loggedUser) => {
  const testimony = await testimonyDB.remove(testimonyId)
  return testimony
}

const countDocuments = async params => {
  const count = await testimonyDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listTestimonies,
  listTestimoniesCourse,
  createTestimony,
  updateTestimony,
  detailTestimony,
  deleteTestimony
}
