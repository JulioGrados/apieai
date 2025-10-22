'use strict'

const service = require('../services/chapter')

const listChapters = async (req, res) => {
  const chapters = await service.listChapters(req.query)
  return res.status(200).json(chapters)
}

const createChapter = async (req, res, next) => {
  try {
    const chapter = await service.createChapter(req.body, req.user)
    return res.status(201).json(chapter)
  } catch (error) {
    next(error)
  }
}

const updateChapter = async (req, res, next) => {
  const chapterId = req.params.id
  try {
    const chapter = await service.updateChapter(chapterId, req.body, req.user)
    return res.status(200).json(chapter)
  } catch (error) {
    next(error)
  }
}

const detailChapter = async (req, res, next) => {
  const chapterId = req.params.id
  const params = req.query
  if (chapterId) {
    if (params.query) {
      params.query._id = chapterId
    } else {
      params.query = {
        _id: chapterId
      }
    }
  }

  try {
    const chapter = await service.detailChapter(params)
    return res.status(200).json(chapter)
  } catch (error) {
    next(error)
  }
}

const deleteChapter = async (req, res, next) => {
  const chapterId = req.params.id
  try {
    const chapter = await service.deleteChapter(chapterId, req.user)
    return res.status(201).json(chapter)
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
  listChapters,
  createChapter,
  updateChapter,
  detailChapter,
  deleteChapter
}
