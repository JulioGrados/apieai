'use strict'

const moment = require('moment-timezone')
const { saveFileCreateName } = require('utils/files/save')
const { courseDB, dealDB, enrolDB, lessonDB, certificateDB } = require('db/lib')
const {
  getDocs,
  copyDocs,
  // exportPDFFile,
  // updateDocs3,
  // updateDocs4,
  // updateDocs5,
  // updateDocs6,
  // updateDocs7,
  // updateDocs8,
  // updateDocs10,
  // updateDocs11,
  // updateDocs12,
  // updateDocs16,
  deleteFile,
  updateSlides,
  getSlides,
  exportPNGSlide
} = require('utils/functions/drive')
const { getImagetoBase64Axios } = require('utils/functions/imagegettobase64')

moment.locale('es')

const listCertificates = async params => {
  const certificates = await certificateDB.list(params)
  return certificates
}

const listDealAgreements = async (params, loggedUser) => {
  try {
    const courseFind = await courseDB.detail({ query: { _id: params['course.ref'] } })
    const certificates = await certificateDB.list({ query: { 'course.ref': courseFind } })
    const migrate = certificates.map( async certificate => {
      // console.log('certificate', certificate)
      let certificateUpdate
      const deals = await dealDB.list({
        query: {
          students: {
            $elemMatch: {
              'student.ref': certificate.linked.ref.toString()
            }
          }
        },
        populate: [ 'client']
      })
      let deal
      deals.find( element => {
        const students = element.students
        const student = students.find(item => item.student.ref.toString() === certificate.linked.ref.toString())
        const courses = student.courses
        const filtered = courses.find(item => item.ref.toString() === courseFind._id.toString())
        if (filtered && filtered.agreement) {
          deal = filtered
        }
      })

      if (!deal) {
        certificateUpdate = await certificateDB.update( certificate._id.toString(), {
          agreement: {
            institution: courseFind.agreement.institution,
            ref: courseFind.agreement.ref
          },
          modality: 'Físico'
        })
        console.log('no entro', certificateUpdate)
      } else {
        certificateUpdate = await certificateDB.update( certificate._id.toString(), {
          agreement: {
            institution: deal.agreement.institution,
            ref: deal.agreement.ref
          },
          modality: deal.modality ? deal.modality : 'Físico'
        })
        console.log('entro', certificateUpdate)
      }

      return await certificateDB.detail({
        query: { _id: certificateUpdate._id.toString() },
        populate: ['linked.ref', 'course.ref', 'agreement.ref']
      })
    })
    const results = await Promise.all(migrate.map(p => p.catch(e => e)))
    return results
  } catch (error) {
    throw error
  }
}

const createAdminCertificate = async (body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFileCreateName(files[label], '/certificates')
      body[label] = route
    }
  }
  const certficate = await certificateDB.create(body)
  return certficate
}

const updateAdminCertificate = async (certficateId, body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      // const certi = await certificateDB.detail({ query: { _id: certficateId }, populate: ['linked.ref', 'course.ref'] })
      const route = await saveFileCreateName(files[label], '/certificates')
      body[label] = route
    }
  }
  const certficate = await certificateDB.update(certficateId, body)
  const certificateDetail = await certificateDB.detail({ query: { _id: certficate._id }, populate: ['linked.ref', 'course.ref'] })
  return certificateDetail
}

const createCertificate = async (body, loggedUser) => {
  const certificate = await certificateDB.create(body)
  return certificate
}

const updateCertificate = async (certificateId, body, loggedUser) => {
  const certificate = await certificateDB.update(certificateId, body)
  return certificate
}

const detailCertificate = async params => {
  const certificate = await certificateDB.detail(params)
  return certificate
}

const detailCertificateOpen = async params => {
  const certificate = await certificateDB.detail(params)
  const user = certificate && certificate.linked && certificate.linked.ref
  const select = 'googleId shortName academicHours numberEvaluation category'
  const course = await courseDB.detail({
    query: {
      _id: certificate.course.ref
    },
    select
  })
  const courses = await courseDB.list({
    query: {
      'category.ref': course.category.ref.toString()
    }
  })
  const enrol = await enrolDB.detail({
    query: {
      'linked.ref': user._id.toString(),
      'course.ref': course._id.toString()
    }
  })
  const googleId = '1JHo73Z83XXgq8bhShItJu3dr_TRwt4UZOcMGlA7grdo'
  let evaluations = course.numberEvaluation
  if (course.numberEvaluation <= 10) { evaluations = 70 } else { evaluations = evaluations * 7 }
  const end = certificate.date
  const dateStart = evaluations * (24 * 60 * 60 * 1000)
  const start = new Date(Date.parse(end) - dateStart)
  const number = `${moment(end).format('YYYY')}-Lima-${certificate.shortCode}`
  const appraisal = enrol && [...enrol.exams, ...enrol.tasks]
  const modules = appraisal && appraisal.sort((a, b) => a.name.split(" ")[1] - b.name.split(" ")[1])
  const lessons = await lessonDB.list({query: {'course.ref': course }})
  lessons.sort((a, b) => (a.order > b.order ? 1 : -1))
  modules && modules.forEach(
    (mod, index) => mod.name = lessons[index].name
  )

  if (!certificate.file1) {
    const doc = await getSlides(googleId)
    const copyDoc = await copyDocs(googleId, doc)
    const update = await updateSlides(copyDoc.id, user, course, moment(start).format('LL'),  moment(end).format('LL'))
    const png = await exportPNGSlide(copyDoc.id)
    const png64 = await getImagetoBase64Axios(png)
    await deleteFile(copyDoc.id)

    return {
      ...certificate.toJSON(),
      png: png64,
      googleId: googleId,
      modules: modules,
      number: number,
      end: moment(end).format('LL'),
      courses: courses.length < 5 ? courses : [courses[0], courses[1], courses[2], courses[3]]
    }
  } else {
    return {
      ...certificate.toJSON(),
      googleId: undefined,
      modules: modules,
      number: number,
      end: moment(end).format('LL'),
      courses: courses.length < 5 ? courses : [courses[0], courses[1], courses[2], courses[3]]
    }
  }
  // if (course.googleId) {
  //   let evaluations
  //   if (course.numberEvaluation <= 10) { evaluations = 70 } else { evaluations = evaluations * 7 }
  //   const end = certificate.date
  //   const dateStart = evaluations * (24 * 60 * 60 * 1000)
  //   const start = new Date(Date.parse(end) - dateStart)
  //   const number = `${moment(end).format('YYYY')}-Lima-${certificate.shortCode}`
  //   const appraisal = enrol && [...enrol.exams, ...enrol.tasks]
  //   const modules = appraisal && appraisal.sort((a, b) => a.name.split(" ")[1] - b.name.split(" ")[1])
  //   const lessons = await lessonDB.list({query: {'course.ref': course }})
  //   lessons.sort((a, b) => (a.order > b.order ? 1 : -1))
  //   modules && modules.forEach(
  //     (mod, index) => mod.name = lessons[index].name
  //   )
    
  //   const doc = await getDocs(course.googleId)
  //   const copyDoc = await copyDocs(course.googleId, doc.body)
  //   if (course.numberEvaluation === 3) {
  //     const updateDoc = await updateDocs3(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 4) {
  //     const updateDoc = await updateDocs4(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 5) {
  //     const updateDoc = await updateDocs5(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 6) {
  //     const updateDoc = await updateDocs6(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 7) {
  //     const updateDoc = await updateDocs7(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 8) {
  //     const updateDoc = await updateDocs8(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 10) {
  //     const updateDoc = await updateDocs10(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 11) {
  //     const updateDoc = await updateDocs11(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 12) {
  //     const updateDoc = await updateDocs12(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   } else if (course.numberEvaluation === 16) {
  //     const updateDoc = await updateDocs16(copyDoc.id, user, course, certificate, modules, number, moment(start).format('LL'),  moment(end).format('LL'))
  //   }
  //   const pdf = await exportPDFFile(copyDoc.id)
  //   const buffer = Buffer.from(pdf);

  //   const base64String = buffer.toString('base64');
  //   await deleteFile(copyDoc.id)
  //   // const convert = await binarybs64(pdf)
  //   // console.log('base64String', base64String)
  //   return {
  //     ...certificate.toJSON(),
  //     pdf: base64String,
  //     googleId: course.googleId
  //   }
  // } else {
  //   return {
  //     ...certificate.toJSON(),
  //     googleId: undefined
  //   }
  // }
}

const deleteCertificate = async (certificateId, loggedUser) => {
  const certificate = await certificateDB.remove(certificateId)
  return certificate
}

const countDocuments = async params => {
  const count = await certificateDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCertificates,
  listDealAgreements,
  createCertificate,
  createAdminCertificate,
  updateAdminCertificate,
  updateCertificate,
  detailCertificate,
  detailCertificateOpen,
  deleteCertificate
}
