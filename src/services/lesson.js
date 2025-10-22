'use strict'

const { lessonDB } = require('db/lib')

const listLessons = async params => {
  const lessons = await lessonDB.list(params)
  return lessons
}

const createLesson = async (body, loggedUser) => {
  const lesson = await lessonDB.create(body)
  return lesson
}

const updateLesson = async (lessonId, body, loggedUser) => {
  const lesson = await lessonDB.update(lessonId, body)
  return lesson
}

const detailLesson = async params => {
  const lesson = await lessonDB.detail(params)
  return lesson
}

const deleteLesson = async (lessonId, loggedUser) => {
  const lesson = await lessonDB.remove(lessonId)
  return lesson
}

const countDocuments = async params => {
  const count = await lessonDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listLessons,
  createLesson,
  updateLesson,
  detailLesson,
  deleteLesson
}
