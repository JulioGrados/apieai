'use strict'

const { chapterDB } = require('db/lib')

const listChapters = async params => {
  const chapters = await chapterDB.list(params)
  return chapters
}

const createChapter = async (body, loggedUser) => {
  const chapter = await chapterDB.create(body)
  return chapter
}

const updateChapter = async (chapterId, body, loggedUser) => {
  const chapter = await chapterDB.update(chapterId, body)
  return chapter
}

const detailChapter = async params => {
  const chapter = await chapterDB.detail(params)
  return chapter
}

const deleteChapter = async (chapterId, loggedUser) => {
  const chapter = await chapterDB.remove(chapterId)
  return chapter
}

const countDocuments = async params => {
  const count = await chapterDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listChapters,
  createChapter,
  updateChapter,
  detailChapter,
  deleteChapter
}
