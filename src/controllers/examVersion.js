'use strict'

const service = require('../services/examVersion')

const listExamVersions = async (req, res) => {
  const exams = await service.listExamVersions(req.query)
  return res.status(200).json(exams)
}

const createExamVersion = async (req, res, next) => {
  try {
    const exam = await service.createExamVersion(req.body, req.exam)
    return res.status(201).json(exam)
  } catch (error) {
    next(error)
  }
}

const updateExamVersion = async (req, res, next) => {
  const examId = req.params.id
  try {
    const exam = await service.updateExamVersion(
      examId,
      req.body,
      req.exam
    )
    return res.status(200).json(exam)
  } catch (error) {
    next(error)
  }
}

const detailExamVersion = async (req, res, next) => {
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
    const exam = await service.detailExamVersion(params)
    return res.status(200).json(exam)
  } catch (error) {
    next(error)
  }
}

const deleteExamVersion = async (req, res, next) => {
  const examId = req.params.id
  try {
    const exam = await service.deleteExamVersion(examId, req.exam)
    return res.status(201).json(exam)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

const setFavoriteVersion = async (req, res, next) => {
  const { examId, versionId } = req.params
  try {
    const version = await service.setFavoriteExamVersion(examId, versionId)
    return res.status(200).json(version)
  } catch (error) {
    next(error)
  }
}

const editVersion = async (req, res, next) => {
  const examId = req.params.versionId
  try {
    const version = await service.editExamVersion(examId, req.body)
    return res.status(200).json(version)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  countDocuments,
  listExamVersions,
  createExamVersion,
  updateExamVersion,
  detailExamVersion,
  deleteExamVersion,
  setFavoriteVersion,
  editVersion
}
