'use strict'

const service = require('../services/question')

const listQuestions = async (req, res) => {
  const questions = await service.listQuestions(req.query)
  return res.status(200).json(questions)
}

const createQuestion = async (req, res, next) => {
  try {
    const question = await service.createQuestion(req.body, req.question)
    return res.status(201).json(question)
  } catch (error) {
    next(error)
  }
}

const updateQuestion = async (req, res, next) => {
  const questionId = req.params.id
  try {
    const question = await service.updateQuestion(
      questionId,
      req.body,
      req.question
    )
    return res.status(200).json(question)
  } catch (error) {
    next(error)
  }
}

const detailQuestion = async (req, res, next) => {
  const questionId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = questionId
  } else {
    params.query = {
      _id: questionId
    }
  }

  try {
    const question = await service.detailQuestion(params)
    return res.status(200).json(question)
  } catch (error) {
    next(error)
  }
}

const deleteQuestion = async (req, res, next) => {
  const questionId = req.params.id
  try {
    const question = await service.deleteQuestion(questionId, req.question)
    return res.status(201).json(question)
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
  listQuestions,
  createQuestion,
  updateQuestion,
  detailQuestion,
  deleteQuestion
}
