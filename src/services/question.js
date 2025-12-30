'use strict'

const { questionDB } = require('db/lib')

const listQuestions = async params => {
  const exams = await questionDB.list(params)
  return exams
}

const createQuestion = async (body, loggedQuestion) => {
  const exam = await questionDB.create(body)
  return exam
}

const updateQuestion = async (examId, body, loggedQuestion) => {
  const exam = await questionDB.update(examId, body)
  return exam
}

const detailQuestion = async params => {
  const exam = await questionDB.detail(params)
  return exam
}

const deleteQuestion = async (examId, loggedQuestion) => {
  const exam = await questionDB.remove(examId)
  return exam
}

const countDocuments = async params => {
  const count = await questionDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listQuestions,
  createQuestion,
  updateQuestion,
  detailQuestion,
  deleteQuestion
}
