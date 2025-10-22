const service = require('../services/migration')
const { csv2json } = require('utils/functions/csv')

const migrateDealsUsers = async (req, res, next) => {
  // console.log('req.files', req.files)
  const data = await csv2json(req.files.csv.data)
  // const data = JSON.parse(req.files.data.data.toString())
  console.log('data', data)
  try {
    const teachers = await service.migrateTeachers(data)
    return res.status(200).json(teachers)
  } catch (error) {
    next(error)
  }
}

const migrateAdminCertificates = async (req, res, next) => {
  const files = Object.keys(req.files).map(key => {
    return req.files[key]
  })
  const certificates = await service.migrateAdminCertificates(files, req.body)
  return res.status(200).json(certificates)
}

const migrateAdminSales = async (req, res, next) => {
  const data = await csv2json(req.files.file.data)
  // console.log('data', data)
  try {
    const sales = await service.migrateAdminSales(data)
    return res.status(200).json(sales)
  } catch (error) {
    next(error)
  }
}

const migrateTeachers = async (req, res, next) => {
  const data = JSON.parse(req.files.data.data.toString())
  try {
    const teachers = await service.migrateTeachers(data)
    return res.status(200).json(teachers)
  } catch (error) {
    next(error)
  }
}

const migrateCourses = async (req, res, next) => {
  req.setTimeout(0)
  const dataCourses = JSON.parse(req.files.courses.data.toString())
  const dataTeachers = JSON.parse(req.files.teachers.data.toString())
  const dataAgreements = JSON.parse(req.files.agreements.data.toString())
  const dataBrochure = await csv2json(req.files.csv.data)
  try {
    const response = await service.migrateCourses(
      dataCourses,
      dataTeachers,
      dataBrochure,
      dataAgreements
    )
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

const migrateMoodleCourses = async (req, res, next) => {
  try {
    const response = await service.migrateMoodleCourses()
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

const migrateMoodleUsers = async (req, res, next) => {
  try {
    const response = await service.migrateUsersMoodle()
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

const migrateMoodleEnroll = async (req, res, next) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateEnrollMoodle()
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

const migrateMoodleEvaluations = async (req, res, next) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateEvaluationsMoodle()
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

const migrateQuizMoodle = async (req, res, next) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateQuizMoodle()
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}
const migrateTaskMoodle = async (req, res, next) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateTaskMoodle()
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}
const migrateCertificates = async (req, res, next) => {
  req.setTimeout(0)
  const dataCertificate = JSON.parse(req.files.certificate.data.toString())
  try {
    const response = await service.migrateCertificates(dataCertificate)
    return res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  migrateDealsUsers,
  migrateTeachers,
  migrateCourses,
  migrateMoodleCourses,
  migrateMoodleUsers,
  migrateMoodleEnroll,
  migrateMoodleEvaluations,
  migrateAdminCertificates,
  migrateAdminSales,
  migrateQuizMoodle,
  migrateTaskMoodle,
  migrateCertificates
}
