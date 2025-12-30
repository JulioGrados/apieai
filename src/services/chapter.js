'use strict'

const { chapterDB } = require('db/lib')

const listChapters = async params => {
  // Agregar populate de versions y favoriteVersion
  const populateParams = {
    ...params,
    populate: [
      ...(params.populate || []),
      { path: 'versions' },
      { path: 'favoriteVersion' }
    ]
  }
  const chapters = await chapterDB.list(populateParams)
  return chapters
}

const createChapter = async (body, loggedUser) => {
  const chapter = await chapterDB.create(body)
  return chapter
}

const updateChapter = async (chapterId, body, loggedUser) => {
  console.log(chapterId)
  console.log(body)
  const chapter = await chapterDB.update(chapterId, body)
  console.log(chapter)
  return chapter
}

const detailChapter = async params => {
  // Agregar populate de versions y favoriteVersion
  const populateParams = {
    ...params,
    populate: [
      ...(params.populate || []),
      { path: 'versions' },
      { path: 'favoriteVersion' }
    ]
  }
  const chapter = await chapterDB.detail(populateParams)
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
