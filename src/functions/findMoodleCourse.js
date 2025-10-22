const { courseDB } = require("../db")
const { getCoursesMoodle } = require("utils/functions/moodle")

const findMoodleCourse = async course => {
  const courses = await getCoursesMoodle()
  const courseEnroll = courses.find(item => item.fullname === course.name)
  if (!courseEnroll) {
    const error = {
      status: 404,
      message: 'No se encontro el curso en Moodle'
    }
    throw error
  } else {
    const courseId = course.ref._id || course.ref || course._id
    await courseDB.update(courseId, {
      moodleId: courseEnroll.id
    })
  }

  return courseEnroll
}

module.exports = {
  findMoodleCourse
}