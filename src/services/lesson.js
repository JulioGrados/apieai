'use strict'

const { lessonDB } = require('db/lib')
const { countDocuments: countChapters } = require('./chapter')
const { countDocuments: countQuestions } = require('./question')

const listLessons = async params => {
  const lessons = await lessonDB.list(params)
  const lessonWithCounts = await Promise.all(
    lessons.map(async lesson => {
      const lessonId = lesson._id
      const chaptersCount = await countChapters({
        query: { lesson: lessonId }
      })

      const questionCount = await countQuestions({
        query: { lesson: lessonId }
      })

      return {
        ...lesson.toJSON(),
        chaptersCount,
        questionCount
      }
    })
  )
  return lessonWithCounts
}

const createLesson = async (body, loggedUser) => {
  const lesson = await lessonDB.create(body)
  return lesson
}

const updateLesson = async (lessonId, body, loggedUser) => {
  console.log('lesson')
  const lesson = await lessonDB.update(lessonId, body)
  const chaptersCount = await countChapters({
    query: { lesson: lessonId }
  })

  const questionCount = await countQuestions({
    query: { lesson: lessonId }
  })
  
  return {
    ...lesson.toJSON(),
    chaptersCount,
    questionCount
  }
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
