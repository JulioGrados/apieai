const { enrolDB } = require('../db')

const studentsEnrolAgreement = async (students) => {
  const enrolAgreement = students.map(async (student) => {
    const user = student.student
    const courses = student.courses
    console.log('user enrol', user)
    console.log('courses enrol', courses)
    const updateEnrolAgreement = courses.map(async (course) => {
      console.log('course enrol', course)
      try {
        const enrol = await enrolDB.detail({ query: { 'course.ref': course._id.toString(), 'linked.ref': user.ref.toString() } })
        console.log('enrol new', enrol)
        return await enrolDB.update( enrol._id.toString(), {
          agreement: {
            institution: course.agreement ? course.agreement.institution : course.ref.agreement.institution,
            ref: course.agreement ? course.agreement.ref : course.ref.agreement.ref
          },
          modality: course.modality ? course.modality : 'Físico'
        })
      } catch (error) {
        return error
      }
    })
    const resultsEnrol = await Promise.all(updateEnrolAgreement.map(p => p.catch(e => e)))
    return resultsEnrol
  })
  const resultsEnrolUsers = await Promise.all(enrolAgreement.map(p => p.catch(e => e)))
  return resultsEnrolUsers
}

module.exports = {
  studentsEnrolAgreement
}