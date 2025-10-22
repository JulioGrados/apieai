'use strict'
const _ = require('lodash')
const slug = require('slug')

const moodle_client = require('moodle-client')
const { wwwroot, token, service } = require('config').moodle
const {
  userDB,
  courseDB,
  examDB,
  taskDB,
  certificateDB,
  lessonDB,
  chapterDB,
  testimonyDB
} = require('db/lib')
const { enrolDB } = require('db/lib')

const init = moodle_client.init({
  wwwroot,
  token,
  service
})

const {
  getCourses,
  enrolCourse,
  createUser,
  userField,
  coursesUser,
  // unenrolUsers,
  gradeUser,
  enrolGetCourse,
  quizGetCourse,
  assignGetCourse,
  moduleGetCourse,
  lessonCourse,
  feedbackGetQuiz,
  feedbackListCourse,
  forumDiscussions,
  getDiscussion
} = require('config').moodle.functions

const actionMoodle = (method, wsfunction, args = {}) => {
  return init.then(function (client) {
    return client
      .call({
        wsfunction,
        method,
        args
      })
      .then(function (info) {
        return info
      })
      .catch(function (err) {
        throw err
      })
  })
}

const saveChapterVideo = async (chapter, course, moduleDb, index, idx) => {
  const name = chapter.name.substring(0, 15)
  const start = chapter.description.indexOf(name)
  const end = chapter.description.indexOf('</p>')
  const title = chapter.description.substring(start, end)
  const titleFilter1 = title.substring(`${(index + 1)}.`.length, title.length)
  const titleFilter2 = titleFilter1.substring(1, titleFilter1.length)
  let titleFilter3 = ''
  if (titleFilter2.charAt(0) === '.') {
    titleFilter3 = titleFilter2.substring(1, titleFilter2.length)
  } else {
    titleFilter3 = titleFilter2
  }
  let titleFilter4 = ''
  if (titleFilter3.charAt(0) === ' ') {
    titleFilter4 = titleFilter3.substring(1, titleFilter2.length)
  } else {
    titleFilter4 = titleFilter3
  }
  const startVideo = chapter.description.indexOf('/video/')
  const endVideo = chapter.description.indexOf('?title=0&amp;')
  const video = chapter.description.substring((startVideo + 7), endVideo).replace('\r\n', '')
  const slugChapter = slug(titleFilter4.toLowerCase())
  let chapterSearch
  try {
    chapterSearch = await chapterDB.detail({ query: { moodleId: chapter.id } })
  } catch (error) {
    console.log('error')
  }

  if (chapterSearch) {
    try {
      const chapterVideo = await chapterDB.update(chapterSearch._id, {
        order: (idx + 1),
        name: titleFilter4,
        slug: slugChapter,
        video: video,
        status: 'video',
        description: '',
        course: course,
        lesson: moduleDb,
        moodleId: chapter.id
      })
      console.log('Se actualizó capítulo que existe:', chapterVideo)
      return chapterVideo
    } catch (error) {
      console.log('Error al actualizar capítulo que existe:', error)
      throw {
        type: 'Actualizar capítulo de video',
        message: `No actualizó el capítulo de video ${titleFilter4}`,
        metadata: titleFilter4,
        error: error
      }
    }
  } else {
    try {
      const chapterVideo = await chapterDB.create({
        order: (idx + 1),
        name: titleFilter4,
        slug: slugChapter,
        video: video,
        status: 'video',
        description: '',
        course: course,
        lesson: moduleDb,
        moodleId: chapter.id
      })
      console.log('Se creó el chapterVideo:', chapterVideo)
      return chapterVideo
    } catch (error) {
      console.log('Error al crear un capítulo')
      throw {
        type: 'Crear capítulo',
        message: `No creó el capítulo ${titleFilter4}`,
        metadata: titleFilter4,
        error: error
      }
    }
  }
}

const saveChapterResource = async (chapter, course, moduleDb, index, idx) => {
  const name = chapter.name
  const url = chapter.contents[0].fileurl.replace('/webservice', '')
  let chapterSearch
  try {
    chapterSearch = await chapterDB.detail({ query: { moodleId: chapter.id } })
  } catch (error) {
    console.log('error')
  }

  if (chapterSearch) {
    try {
      const chapterVideo = await chapterDB.update(chapterSearch._id, {
        order: (idx + 1),
        name: name,
        slug: slug(name),
        url: url,
        video: '',
        status: 'file',
        description: '',
        course: course,
        lesson: moduleDb,
        moodleId: chapter.id
      })
      console.log('Se actualizó capítulo que existe:', chapterVideo)
      return chapterVideo
    } catch (error) {
      console.log('Error al actualizar capítulo que existe:', error)
      throw {
        type: 'Actualizar capítulo de video',
        message: `No actualizó el capítulo de video ${titleFilter4}`,
        metadata: titleFilter4,
        error: error
      }
    }
  } else {
    try {
      const chapterVideo = await chapterDB.create({
        order: (idx + 1),
        name: name,
        slug: slug(name),
        url: url,
        video: '',
        status: 'file',
        description: '',
        course: course,
        lesson: moduleDb,
        moodleId: chapter.id
      })
      console.log('Se creó el chapterVideo:', chapterVideo)
      return chapterVideo
    } catch (error) {
      console.log('Error al crear un capítulo')
      throw {
        type: 'Crear capítulo',
        message: `No creó el capítulo ${titleFilter4}`,
        metadata: titleFilter4,
        error: error
      }
    }
  }
}

const saveChapterForum = async (chapter, course, moduleDb, index, idx) => {
  // console.log('chapter', chapter)
  // console.log('index', index)
  // console.log('idx', idx)
  const forum = await actionMoodle('POST', forumDiscussions, {
    forumid: chapter.instance
  })
  // console.log('forum', forum)
  const discussions = forum.discussions.map(async item => {
    // console.log('discussion', item)
    const discussion = await actionMoodle('POST', getDiscussion, {
      discussionid: item.discussion
    })
    console.log('discussion', item, 'comments', discussion)
  })
}

const getLessions = async ( ) => {
  const feedBackModule = await actionMoodle('GET', moduleGetCourse, {
    courseid: 28
  })

  const course = await courseDB.detail({query: {moodleId: 28}})

  const modulesFilter = feedBackModule.filter(
    item => item.name !== 'General' && item.visible === 1
  )
  
  modulesFilter.map(async (lesson, index) => {
    // console.log('lesson', lesson)
    const moduleDb = await lessonDB.detail({ query: { moodleId: '28m' + lesson.id } })
    const chaptersModule = lesson.modules && lesson.modules.filter(
      item =>
        (item.modname === 'label' && item.visible === 1 && item.description.includes('player.vimeo.com')) ||
        (item.modname === 'resource' && item.visible === 1) ||
        (item.modname === 'forum' && item.visible === 1)
    )
    chaptersModule.map(async (chapter, idx) => {
      if (chapter.modname === 'label') {
        // await saveChapterVideo(chapter, course, moduleDb, index, idx) 
      }

      if (chapter.modname === 'resource') {
        // await saveChapterResource(chapter, course, moduleDb, index, idx) 
      }

      if (chapter.modname === 'forum') {
        await saveChapterForum(chapter, course, moduleDb, index, idx) 
      }
    })
    // console.log('chaptersModules', chaptersModules)
  })
  return feedBackModule
}

module.exports = {
  getLessions
}