'use strict'

const { examDB } = require('db/lib')

const listExams = async params => {
  // Agregar populate para versions y favoriteVersion
  if (!params.populate) {
    params.populate = ['versions', 'favoriteVersion']
  }
  const exams = await examDB.list(params)
  return exams
}

const createExam = async (body, loggedExam) => {
  const exam = await examDB.create(body)
  return exam
}

const updateExam = async (examId, body, loggedExam) => {
  const exam = await examDB.update(examId, body)
  return exam
}

const detailExam = async params => {
  // Agregar populate para versions y favoriteVersion
  if (!params.populate) {
    params.populate = ['versions', 'favoriteVersion']
  }
  const exam = await examDB.detail(params)
  return exam
}

const deleteExam = async (examId, loggedExam) => {
  const exam = await examDB.remove(examId)
  return exam
}

const countDocuments = async params => {
  const count = await examDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listExams,
  createExam,
  updateExam,
  detailExam,
  deleteExam
}
