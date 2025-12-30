'use strict'

const service = require('../services/chapterversion')

const listChapterVersions = async (req, res) => {
  const chapters = await service.listChapterVersions(req.query)
  return res.status(200).json(chapters)
}

const createChapterVersion = async (req, res, next) => {
  try {
    const chapter = await service.createChapterVersion(req.body, req.user)
    return res.status(201).json(chapter)
  } catch (error) {
    next(error)
  }
}

const updateChapterVersion = async (req, res, next) => {
  const chapterId = req.params.id
  try {
    const chapter = await service.updateChapterVersion(chapterId, req.body, req.user)
    return res.status(200).json(chapter)
  } catch (error) {
    next(error)
  }
}

const detailChapterVersion = async (req, res, next) => {
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
    const chapter = await service.detailChapterVersion(params)
    return res.status(200).json(chapter)
  } catch (error) {
    next(error)
  }
}

const deleteChapterVersion = async (req, res, next) => {
  const chapterId = req.params.id
  try {
    const chapter = await service.deleteChapterVersion(chapterId, req.user)
    return res.status(201).json(chapter)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

const setFavoriteVersion = async (req, res, next) => {
  const { chapterId, versionId } = req.params
  try {
    const version = await service.setFavoriteChapterVersion(chapterId, versionId)
    return res.status(200).json(version)
  } catch (error) {
    next(error)
  }
}

const editVersion = async (req, res, next) => {
  const chapterId = req.params.versionId
  try {
    const version = await service.editChapterVersion(chapterId, req.body)
    return res.status(200).json(version)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  countDocuments,
  listChapterVersions,
  createChapterVersion,
  updateChapterVersion,
  detailChapterVersion,
  deleteChapterVersion,
  setFavoriteVersion,
  editVersion
}
