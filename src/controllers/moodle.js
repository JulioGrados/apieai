'use strict'

const services = require('../services/moodle')

const createUser = async (req, res, next) => {
  try {
    const user = await services.createNewUser(req.body)
    return user
  } catch (error) {
    next(error)
  }
}

const createCertificates = async (req, res, next) => {
  try {
    const resp = await services.gradeNewCertificate(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

const enrrollUser = async (req, res, next) => {
  try {
    const enroll = await services.createEnrolUser(req.body)
    return enroll
  } catch (error) {
    next(error)
  }
}

const createModulesCourse = async (req, res, next) => {
  try {
    const resp = await services.modulesCourse(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

const migrateUsers = async (req, res, next) => {
  try {
    const resp = await services.usersMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

const migrateEvaluations = async (req, res, next) => {
  try {
    const resp = await services.evaluationMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

const migrateEnrols = async (req, res, next) => {
  try {
    const resp = await services.enrolMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}


const migrateCertificates = async (req, res, next) => {
  try {
    const resp = await services.certificateMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

const migrateGrades = async (req, res) => {
  const resp = await services.usersGrades(req.body)
  return res.json(resp)
}

const migrateTestimonies = async (req, res, next) => {
  try {
    const resp = await services.testimoniesCourse(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

const migrateShipping = async (req, res, next) => {
  try {
    const resp = await services.createShippingEnrol(req.body)
    return res.json(resp)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createUser,
  enrrollUser,
  migrateUsers,
  migrateGrades,
  migrateEvaluations,
  migrateCertificates,
  migrateEnrols,
  createCertificates,
  createModulesCourse,
  migrateShipping,
  migrateTestimonies
}
