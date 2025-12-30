'use strict'

const service = require('../services/exam')

const listExams = async (req, res) => {
  const exams = await service.listExams(req.query)
  return res.status(200).json(exams)
}

const createExam = async (req, res, next) => {
  try {
    const exam = await service.createExam(req.body, req.exam)
    return res.status(201).json(exam)
  } catch (error) {
    next(error)
  }
}

const updateExam = async (req, res, next) => {
  const examId = req.params.id
  try {
    const exam = await service.updateExam(
      examId,
      req.body,
      req.exam
    )
    return res.status(200).json(exam)
  } catch (error) {
    next(error)
  }
}

const detailExam = async (req, res, next) => {
  const examId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = examId
  } else {
    params.query = {
      _id: examId
    }
  }

  try {
    const exam = await service.detailExam(params)
    return res.status(200).json(exam)
  } catch (error) {
    next(error)
  }
}

const deleteExam = async (req, res, next) => {
  const examId = req.params.id
  try {
    const exam = await service.deleteExam(examId, req.exam)
    return res.status(201).json(exam)
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
  listExams,
  createExam,
  updateExam,
  detailExam,
  deleteExam
}
