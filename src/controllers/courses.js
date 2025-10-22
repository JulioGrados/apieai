'use strict'

const service = require('../services/course')

const listCourses = async (req, res) => {
  const courses = await service.listCourses(req.query)
  return res.status(200).json(courses)
}

const createCourse = async (req, res, next) => {
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const course = await service.createCourse(body, files, req.user)
    return res.status(201).json(course)
  } catch (error) {
    next(error)
  }
}

const updateCourse = async (req, res, next) => {
  const courseId = req.params.id
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const course = await service.updateCourse(courseId, body, files, req.user)
    return res.status(200).json(course)
  } catch (error) {
    next(error)
  }
}

const updateDealCreate = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealCreate(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const detailCourse = async (req, res, next) => {
  let courseId
  const params = req.query
  
  if (params && params.params) {
    const paramsID = JSON.parse(params.params)
    courseId = paramsID.id
  }

  if (courseId) {
    if (params.query) {
      params.query._id = courseId
    } else {
      params.query = {
        _id: courseId
      }
    }
  }

  // if (params.query && courseId) {
  //   params.query._id = courseId
  // } else if (courseId) {
  //   params.query = {
  //     _id: courseId
  //   }
  // }

  try {
    const course = await service.detailCourse(params)
    return res.status(200).json(course)
  } catch (error) {
    next(error)
  }
}

const detailCourseFirst = async (req, res, next) => {
  const courseId = req.params.id
  const params = req.query
  if (params.query && courseId) {
    params.query._id = courseId
  } else if (courseId) {
    params.query = {
      _id: courseId
    }
  }

  try {
    const course = await service.detailCourse(params)
    return res.status(200).json(course)
  } catch (error) {
    next(error)
  }
}

const deleteCourse = async (req, res, next) => {
  const courseId = req.params.id
  try {
    const course = await service.deleteCourse(courseId, req.user)
    return res.status(201).json(course)
  } catch (error) {
    next(error)
  }
}

const listOpenCourses = async (req, res) => {
  const params = {
    ...req.query,
    select: req.query.select
      ? req.query.select.replace('clases', '')
      : { clases: 0 }
  }
  const courses = await service.listCourses(params)
  return res.status(200).json(courses)
}

const priceCourses = async (req, res, next) => {
  try {
    const deal = await service.priceCourses(req.body, req.user)
    return res.status(201).json(deal)
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
  listCourses,
  createCourse,
  updateCourse,
  updateDealCreate,
  detailCourse,
  detailCourseFirst,
  deleteCourse,
  priceCourses,
  listOpenCourses
}
