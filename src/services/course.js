'use strict'

const { courseDB, dealDB, userDB } = require('db/lib')
const { saveFile } = require('utils/files/save')

const currenciesData = require('utils/functions/currencies')

const listCourses = async params => {
  const courses = await courseDB.list(params)
  return courses
}

const createCourse = async (body, files, loggedCourse) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/courses')
      body[label] = route
    }
  }
  const course = await courseDB.create(body)
  return course
}

const updateCourse = async (courseId, body, files, loggedCourse) => {
  const brochures = body.brochures.filter(item => item.upload)
  if (files) {
    for (const label in files) {
      if (label.includes('brochure')) {
        const route = await saveFile(files[label], '/courses')
        const index = label.substring(8, label.length)
        if (index === 'File') {
          body.brochure = route
        } else {
          const brochure = body.brochures[index]
          brochures.push({
            url: route,
            upload: true,
            money: brochure.money
          })
        }
      } else {
        const route = await saveFile(files[label], '/courses')
        body[label] = route
      }
    }
  }
  body.brochures = brochures
  const course = await courseDB.update(courseId, body)
  return course
}

const updateDealCreate = async (dealId, body, loggedUser) => {
  // console.log('dealId', dealId)
  // console.log('body', body)
  let deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  const userId = deal.client._id
  const courseId = deal.students[0].courses[0] && deal.students[0].courses[0]._id
  const course = await courseDB.detail({
    query: { _id: courseId }
  })

  const user = await userDB.detail({
    query: { _id: userId }
  })

  deal.students[0].courses[0] = {...course.toJSON(), ref: course.toJSON()}
  deal.students[0].student = {...user.toJSON(), ref: user.toJSON()}
  const updateDeal = await dealDB.update(dealId, {students: deal.students, origin: 'sitio web'})
  
  return updateDeal
}

const detailCourse = async params => {
  const course = await courseDB.detail(params)
  return course
}

const deleteCourse = async (courseId, loggedCourse) => {
  const course = await courseDB.remove(courseId)
  return course
}

const priceCourses = async (body, loggedUser) => {
  const courses = body.courses
  const money = body.money
  const amount = body.amount
  const moneyObj = currenciesData.find((item) => item.code === money)
  const coursesUpdate = courses.map(async element => { 
    try {
      const course = await courseDB.detail({ query: { _id: element._id } })
      const coins = course.coins
      const index = coins.findIndex(item => item.code === money)
      if ( index >= 0) {
        coins[index].price = amount
        coins[index].priceOffert = amount
      } else {
        const coin = {
          symbol: moneyObj.symbol,
          name: moneyObj.name,
          code: money,
          price: amount,
          priceOffert: amount
        }
        coins.push(coin)
      }
      const courseUpd = await courseDB.update(element._id, {
        coins: coins
      })
      return courseUpd
    } catch (error) {
      throw error
    }
      
  })

  const results = await Promise.all(coursesUpdate.map(p => p.catch(e => e)))
  const validCourses = results.filter(result => !result.error)
  const errorCourses = results.filter(result => result.error)

  return { validCourses, errorCourses }
}

const countDocuments = async params => {
  const count = await courseDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCourses,
  createCourse,
  updateCourse,
  updateDealCreate,
  detailCourse,
  priceCourses,
  deleteCourse
}
