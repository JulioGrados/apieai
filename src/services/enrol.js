'use strict'
const fs = require('fs')
const moment = require('moment-timezone')
const CustomError = require('custom-error-instance')
const {
  userDB,
  courseDB,
  examDB,
  taskDB,
  dealDB,
  enrolDB,
  lessonDB
} = require('db/lib')

const { createEmailOnly } = require('./email')
const { getSocket } = require('../lib/io')
const { calculateProm, calculatePromBoth } = require('utils/functions/enrol')
const { sendEmail } = require('utils/lib/sendgrid')
const { gradeUserMoodle, feedbackGetQuizMoodle, feedbackListCourseMoodle, getCoursesMoodle, enrolCourseMoodle } = require('utils/functions/moodle')
const { createNewUserMoodle } = require('../functions/createNewUserMoodle')
const { studentsEnrolAgreement } = require('../functions/enrolAgreement')
const { findMoodleCourse } = require('../functions/findMoodleCourse')
const { getDocs, copyDocs, exportPDFFile, updateDoc, deleteFile, getSlides, updateSlides, exportPNGSlide, updateDocs4, updateDocs5, updateDocs6, updateDocs7, updateDocs8, updateDocs10, updateDocs11, updateDocs12, updateDocs16, updateDocs3, updateDocs25 } = require('utils/functions/drive')
const { getImagetoBase64Axios } = require('utils/functions/imagegettobase64')

moment.locale('es')

const listEnrols = async params => {
  const enrols = await enrolDB.list(params)
  return enrols
}

const listEnrolsAgreements = async (params, loggedUser) => {
  try {
    const courseFind = await courseDB.detail({ query: { _id: params['course.ref'] } })
    const enrols = await enrolDB.list({ query: { 'course.ref': courseFind } })
    const migrate = enrols.map( async enrol => {
      // console.log('enrol', enrol)
      let enrolUpdate
      const deals = await dealDB.list({
        query: {
          students: {
            $elemMatch: {
              'student.ref': enrol.linked.ref.toString()
            }
          }
        },
        populate: [ 'client']
      })
      let deal
      deals.find( element => {
        const students = element.students
        const student = students.find(item => item.student.ref.toString() === enrol.linked.ref.toString())
        const courses = student.courses
        const filtered = courses.find(item => item.ref.toString() === courseFind._id.toString())
        if (filtered && filtered.agreement) {
          deal = filtered
        }
      })

      if (!deal) {
        enrolUpdate = await enrolDB.update( enrol._id.toString(), {
          agreement: {
            institution: courseFind.agreement.institution,
            ref: courseFind.agreement.ref
          }
        })
        console.log('no entro', enrolUpdate)
      } else {
        enrolUpdate = await enrolDB.update( enrol._id.toString(), {
          agreement: {
            institution: deal.agreement.institution,
            ref: deal.agreement.ref
          }
        })
        console.log('entro', enrolUpdate)
      }

      return await enrolDB.detail({
        query: { _id: enrolUpdate._id.toString() },
        populate: ['linked.ref', 'course.ref', 'agreement.ref']
      })
    })
    const results = await Promise.all(migrate.map(p => p.catch(e => e)))
    return results
  } catch (error) {
    throw error
  }
}

const listRatings = async params => {
  const enrols = await enrolDB.ratings(params)
  return enrols
}

const listGeneral = async params => {
  const enrols = await enrolDB.general(params)
  return enrols
}

const createEnrol = async (body, loggedUser) => {
  const enrol = await enrolDB.create(body)
  return enrol
}

const createEnrolUserMoodle = async ({ user, course, deal }) => {
  let courseId
  if (course.ref && course.ref.moodleId) {
    courseId = course.ref.moodleId
  } else {
    const courseEnroll = await findMoodleCourse(course)
    courseId = courseEnroll.id
  }

  let userId
  
  if (user.moodleId) {
    userId = user.moodleId
  } else {
    const newUser = await createNewUserMoodle(user)
    userId = newUser.id
  }

  const enroll = {
    roleid: '5',
    userid: parseInt(userId),
    courseid: parseInt(courseId)
  }

  await enrolCourseMoodle(enroll)
  
  try {
    const enrol = await enrolDB.detail({ query: { 'linked.ref': user._id, 'course.ref': course._id } })
    console.log('enrol', enrol)
  } catch (error) {
    const enrol = await enrolDB.create({
      linked: {
        ...user.toJSON(),
        ref: user
      },
      course: {
        ...course,
        ref: course
      }
    })
    const enrolDetail = await enrolDB.detail({ query: { _id: enrol._id }, populate: ['linked.ref', 'course.ref'] })
    const tesorero = await userDB.detail({
      query: {
        roles: 'Tesorero'
      }
    })
    const enrolSearch = {
      ...enrolDetail.toJSON(),
      assigned: {...tesorero.toJSON()}
    }
    emitEnrol(enrolSearch)
    console.log('enrol nuevo', enrol)
  }
  const updateEnrol = await studentsEnrolAgreement(deal.students)
  console.log('updateEnrol', updateEnrol)
  return true
}

const createEmailEnrol = async (body) => {
  const msg = {
    to: body.to,
    cc: body.cc,
    from: 'cursos@eai.edu.pe',
    subject: body.subject,
    preheader: body.subject,
    text: body.text,
    html: body.html,
    content: body.html,
    fromname: body.fromname,
    attachments: [
      {
        filename: body.constance ? 'constancia.pdf' : 'certificado.pdf',
        content: body.pdf,
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  }
  const save = {
    to: body.to,
    cc: body.cc,
    from: 'cursos@eai.edu.pe',
    subject: body.subject,
    preheader: body.subject,
    text: body.text,
    html: body.html,
    content: body.html,
    fromname: body.fromname
  }
  await createEmailOnly(save)
  const enrol = await sendEmail(msg)
  return enrol
}

const sendEnrolCertificate = async (body) => { 
  const certificate = body.certificate.ref
  const course = body.course.ref
  const user = body.linked.ref
  const enrol = body
  try {
    // const googleId = '1lHcVTxtNjzhfvQ1fCrlK-5rwDjedRVc1z4UoW7J7kVQ'
    // let evaluations = course.numberEvaluation
    // if (course.numberEvaluation <= 10) { evaluations = 70 } else { evaluations = evaluations * 7 }
    // const end = certificate.date
    // const dateStart = evaluations * (24 * 60 * 60 * 1000)
    // const start = new Date(Date.parse(end) - dateStart)

    // const doc = await getDocs(googleId)
    // const copyDoc = await copyDocs(googleId, doc.body)
    // const updateDocs = await updateDoc(copyDoc.id, user, course, certificate, moment(start).format('LL'),  moment(end).format('LL'))
    // const pdf = await exportPDFFile(copyDoc.id)
    // const buffer = Buffer.from(pdf)
    // const base64String = buffer.toString('base64')
    // await deleteFile(copyDoc.id)

    if (course.googleId) {
      let evaluations = course.numberEvaluation
      if (course.numberEvaluation <= 10) { evaluations = 70 } else { evaluations = evaluations * 7 }
      const end = certificate.date
      const dateStart = evaluations * (24 * 60 * 60 * 1000)
      const start = new Date(Date.parse(end) - dateStart)
      const number = `${moment(end).format('YYYY')}-Lima-${certificate.shortCode}`
      const appraisal = enrol && [...enrol.exams, ...enrol.tasks]
      const modules = appraisal && appraisal.sort((a, b) => a.name.split(" ")[1] - b.name.split(" ")[1])
      const lessons = await lessonDB.list({ query: { 'course.ref': course } })
      lessons.sort((a, b) => (a.order > b.order ? 1 : -1))
      modules && modules.forEach(
        (mod, index) => mod.name = lessons[index].name
      )
      
      const doc = await getDocs(course.googleId)
      const copyDoc = await copyDocs(course.googleId, doc.body)
      if (course.numberEvaluation === 3) {
        const updateDoc = await updateDocs3(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 4) {
        const updateDoc = await updateDocs4(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 5) {
        const updateDoc = await updateDocs5(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 6) {
        const updateDoc = await updateDocs6(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 7) {
        const updateDoc = await updateDocs7(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 8) {
        const updateDoc = await updateDocs8(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 10) {
        const updateDoc = await updateDocs10(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 11) {
        const updateDoc = await updateDocs11(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 12) {
        const updateDoc = await updateDocs12(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 16) {
        const updateDoc = await updateDocs16(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      } else if (course.numberEvaluation === 25) {
        const updateDoc = await updateDocs25(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'), moment(end).format('LL'))
      }
      
      const pdf = await exportPDFFile(copyDoc.id)
      const buffer = Buffer.from(pdf)

      const base64String = buffer.toString('base64')
      await deleteFile(copyDoc.id)

      const msg = {
        to: user.email, //{user.email}
        cc: 'cursos@eai.edu.pe',
        from: 'cursos@eai.edu.pe',
        subject: `Certificado digital -  ${course.name} - ${user.lastName.toUpperCase()}, ${user.firstName.toUpperCase()}`,
        fromname: `Escuela Americana de Innovación`,
        html: `
            Saludos ${user.firstName.toUpperCase()}
            <br><br>
            Adjuntamos el certificado digital correspondiente al ${course.name}.
            <br><br>
            Gracias.
            <br><br>
            --
            <br>
            Atte.
            <br>
            Área Comercial
            <br>
            Escuela Americana de Innovación
            <br>
            Teléfono: (+51)987184188
            <br>
            WhatsApp: https://wa.me/51987184188
            <br>
            Calle Las Camelias 877, Oficina 302 - San Isidro - Lima
          `,
        pdf: base64String
      }
      const send = await createEmailEnrol(msg)
      return send
    } else {
      const InvalidError = CustomError('CastError', { message: 'Curso no tiene Google ID', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  } catch (error) {
    throw error
  }
}

const getEnrolCertificate = async (query) => { 
  try {
    const enrol = await enrolDB.detail({
      query: { _id: query._id },
      populate: ['certificate.ref', 'course.ref', 'linked.ref']
    })
    // console.log('enrol', enrol)
    const certificate = enrol.certificate.ref
    const course = enrol.course.ref
    const user = enrol.linked.ref
    const googleId = '1JHo73Z83XXgq8bhShItJu3dr_TRwt4UZOcMGlA7grdo'
    let evaluations = course.numberEvaluation
    if (course.numberEvaluation <= 10) {
      evaluations = 70
    } else {
      evaluations = evaluations * 7
    }
    const end = certificate.date
    const dateStart = evaluations * (24 * 60 * 60 * 1000)
    const start = new Date(Date.parse(end) - dateStart)
    const doc = await getSlides(googleId)
    const copyDoc = await copyDocs(googleId, doc)
    const update = await updateSlides(copyDoc.id, user, course, moment(start).format('LL'),  moment(end).format('LL'))
    const png = await exportPNGSlide(copyDoc.id)
    const png64 = await getImagetoBase64Axios(png)
    await deleteFile(copyDoc.id)
    return {
      png: png64,
      googleId: googleId,
      success: true
    }
  } catch (error) {
    throw error
  }
}

const updateEnrol = async (enrolId, body, loggedUser) => {
  const enrol = await enrolDB.update(enrolId, body)
  return enrol
}

const updateMoodle = async (enrolId, body, loggedUser) => {
  // const enrol = await enrolDB.update(enrolId, body)
  console.log('enrolId', enrolId)
  // const users = await userDB.list({})
  const enrol = await enrolDB.detail({ query: { _id: enrolId } })
  console.log('enrol', enrol)
  console.log('body', body)
  let course
  try {
    course = await courseDB.detail({ query: { _id: enrol.course.ref.toString()} })
    // console.log('course', course)
  } catch (error) {
    throw error
  }

  let user
  try {
    user = await userDB.detail({ query: { _id: enrol.linked.ref.toString() } })
    console.log('user', user)
  } catch (error) {
    throw error
  }

  if (user && user.moodleId) {
    
    const contents = await gradeUserMoodle(user.moodleId,course.moodleId)
    console.log('contents', contents)
    let gradeFilter = contents.usergrades[0].gradeitems.filter(
      item =>
        (item.itemname && item.itemname.indexOf('Evaluación') > -1) ||
        (item.itemname && item.itemname.indexOf('Evaluacion') > -1)
    )

    console.log('contents', contents)
    console.log('gradeFilter', gradeFilter)
    let dataEnrol
    if (course.typeOfEvaluation === 'exams') {
      let examsBD
      try {
        examsBD = await examDB.list({
          query: { 'course.moodleId': course.moodleId },
          sort: 'number'
        })
      } catch (error) {
        return error
      }
      // console.log('examsDB', examsDB)

      const exams = examsBD.map(exam => {
        const result = gradeFilter.find(
          item => item.itemname === exam.name
        )

        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          exam: exam._id
        }
        return data
      })
      console.log('exams', exams)

      const examEnd = calculateProm(exams)
      if (course.numberEvaluation !== exams.length) {
        examEnd.isFinished = false
      }

      console.log('examEnd', examEnd)

      console.log('user', user)
      if (examEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          isFinished: true,
          score: examEnd.note,
          finalScore: examEnd.note,
          certificate: {}
        }
      } else {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          isFinished: false,
          score: examEnd.note,
          certificate: {}
        }
      }
      console.log('dataEnrol', dataEnrol)
    } else if (course.typeOfEvaluation === 'tasks') {
      let tasksBD
      try {
        tasksBD = await taskDB.list({
          query: { 'course.moodleId': course.moodleId },
          sort: 'number'
        })
      } catch (error) {
        return error
      }

      const tasks = tasksBD.map(task => {
        const result = gradeFilter.find(
          item => item.itemname === task.name
        )
        console.log('result', result)
        const data = {
          number: task.number,
          name: task.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          task: task._id
        }
        return data
      })

      const taskEnd = calculateProm(tasks)

      if (course.numberEvaluation !== tasks.length) {
        examEnd.isFinished = false
      }

      let dataEnrol
      if (taskEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          tasks: tasks,
          isFinished: true,
          score: taskEnd.note,
          finalScore: taskEnd.note,
          certificate: {}
        }
      } else {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          tasks: tasks,
          isFinished: false,
          score: taskEnd.note,
          certificate: {}
        }
      }

      console.log('dataEnrol', dataEnrol)
    } else if (course.typeOfEvaluation === 'both') {
      let examsBD
      try {
        examsBD = await examDB.list({
          query: { 'course.moodleId': course.moodleId },
          sort: 'number'
        })
      } catch (error) {
        return error
      }
      let tasksBD
      try {
        tasksBD = await taskDB.list({
          query: { 'course.moodleId': course.moodleId },
          sort: 'number'
        })
      } catch (error) {
        return error
      }

      const exams = examsBD.map(exam => {
        const result = gradeFilter.find(
          item => item.itemname === exam.name
        )

        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken: result && parseInt(result.graderaw) >= 11 ? true : false,
          exam: exam._id
        }
        return data
      })

      const tasks = tasksBD.map(task => {
        const result = gradeFilter.find(
          item => item.itemname === task.name
        )

        const data = {
          number: task.number,
          name: task.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken: result && parseInt(result.graderaw) >= 11 ? true : false,
          task: task._id
        }
        return data
      })

      const bothEnd = calculatePromBoth(exams, tasks)

      if (course.numberEvaluation !== tasks.length + exams.length) {
        examEnd.isFinished = false
      }

      let dataEnrol
      if (bothEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          tasks: tasks,
          isFinished: true,
          score: bothEnd.note,
          finalScore: bothEnd.note,
          certificate: {}
        }
      } else {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          tasks: tasks,
          isFinished: false,
          score: bothEnd.note,
          certificate: {}
        }
      }
    }
    const enrolUpdate = await enrolDB.update(enrolId, dataEnrol)
    console.log('enrol', enrolUpdate)
    return enrolUpdate
  } else {
    const InvalidError = CustomError('CastError', { message: 'Ocurrio un error no se encontro un moodleId en el usuario', code: 'EINVLD' }, CustomError.factory.expectReceive)
    throw new InvalidError()
  }
  
}

const createAddressEnrol = async arr => {
  const address = arr.map(async element => {
    let course
    try {
      course = await courseDB.detail({
        query: { moodleId: element.courseid },
        select: 'name slug'
      })
    } catch (error) {
      throw error
    }
    let user
    try {
      user = await userDB.detail({
        query: { email: element.email },
        select: 'username email moodleId'
      })
    } catch (error) {
      throw error
    }

    // console.log('course', course)
    // console.log('user', user)

    let enrol
    try {
      enrol = await enrolDB.detail({
        query: { 'linked.ref': user, 'course.ref': course },
        select: 'linked course shipping'
      })
    } catch (error) {
      throw error
    }

    // console.log('enrol', enrol)

    const feedBackCourse = await feedbackListCourseMoodle(element.courseid)
    
    const feedback = feedBackCourse.feedbacks.find(
      item => item.name.indexOf('certificado') > -1
    )

    if (feedback) {
      const feedBackModule = await feedbackGetQuizMoodle(feedback.id)

      const newsFeedBack = feedBackModule.attempts.find(element => 
        (parseInt(user.moodleId) === parseInt(element.userid))
      )

      
      if (newsFeedBack) {
        const shipping = {
          moodleId: parseInt(newsFeedBack.id),
          date: newsFeedBack.timemodified,
          firstName: newsFeedBack.responses[0].rawval,
          lastName: newsFeedBack.responses[1].rawval,
          dni: newsFeedBack.responses[2].rawval,
          cellphone: newsFeedBack.responses[3].rawval,
          address: newsFeedBack.responses[4].rawval,
          priority: 'Principal'
        }

        try {
          const updateEnrol = await enrolDB.update(enrol._id, {
            shipping: shipping
          })
          // console.log('Se actualizó usuario shipping:', updateEnrol)
          return updateEnrol
        } catch (error) {
          // console.log('error al editar enrol')
          throw {
            type: 'Actualizar enrol',
            message: `No actualizó el enrol ${enrol._id}`,
            metadata: enrol,
            error: error
          }
        }
      } else {
        throw {
          type: 'No se encontro la dirección de envío',
          message: `No actualizó el enrol ${user.email}`,
          metadata: user.email
        }
      }
    } else {
      throw {
        type: 'No se encontro el curso en moodle',
        message: `No actualizó el enrol ${user.email}`,
        metadata: user.email
      }
    }
  })

  const results = await Promise.all(address.map(p => p.catch(e => e)))
  const validAddress = results.filter(result => !result.error)
  const errorAddress = results.filter(result => result.error)
  return { validAddress, errorAddress }
  // return results
}

const detailEnrol = async params => {
  const enrol = await enrolDB.detail(params)
  return enrol
}

const deleteEnrol = async (enrolId, loggedEnrol) => {
  const enrol = await enrolDB.remove(enrolId)
  return enrol
}

const countDocuments = async params => {
  const count = await enrolDB.count(params)
  return count
}

const emitEnrol = enrol => {
  console.log('enrol.asigned', enrol.assigned)
  if (enrol.assigned) {
    const io = getSocket()
    io.to(enrol.assigned._id).emit('enrol', enrol)
  }
}

module.exports = {
  countDocuments,
  listEnrols,
  listEnrolsAgreements,
  listRatings,
  listGeneral,
  createEnrol,
  createEmailEnrol,
  createAddressEnrol,
  createEnrolUserMoodle,
  updateEnrol,
  updateMoodle,
  detailEnrol,
  getEnrolCertificate,
  sendEnrolCertificate,
  emitEnrol,
  deleteEnrol
}
