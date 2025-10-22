'use strict'

const service = require('../services/enrol')

const listEnrols = async (req, res) => {
  const enrols = await service.listEnrols(req.query)
  return res.status(200).json(enrols)
}

const listRatings = async (req, res, next) => {
  try {
    const enrols = await service.listRatings(req.query)
    const filter = enrols.map(enrol => {
      let info = {}
      let evaluations = enrol && enrol.course && enrol.course.ref ? enrol.course.ref.numberEvaluation : 0
      if (evaluations <= 10) { evaluations = 70 } else { evaluations = evaluations * 7 }
      
      info._id = enrol && enrol.certificate ? enrol.certificate.ref && enrol.certificate.ref._id : enrols._id
      info.processing = enrol && enrol.certificate && enrol.certificate.ref ? enrol.certificate.ref.createdAt : ''
      info.end = enrol && enrol.certificate && enrol.certificate.ref ? enrol.certificate.ref.date : ''
      info.dateStart = evaluations ? evaluations * (24 * 60 * 60 * 1000) : ''
      info.start = info.dateStart && info.end && new Date(Date.parse(info.end) - info.dateStart)
      info.linkedEmail = enrol && enrol.linked && enrol.linked.ref ? enrol.linked.ref.email : ''
      info.linkedBeforeName = enrol && enrol.linked && enrol.linked.ref ? enrol.linked.ref.beforeName : ''
      info.linkedFirstName = enrol && enrol.linked && enrol.linked.ref ? enrol.linked.ref.firstName : ''
      info.linkedLastName = enrol && enrol.linked && enrol.linked.ref ? enrol.linked.ref.lastName : ''
      info.courseName = enrol && enrol.course && enrol.course.ref ? enrol.course.ref.name : ''
      info.courseMoodleId = enrol && enrol.course && enrol.course.ref ? enrol.course.ref.moodleId : ''
      info.agreement = enrol && enrol.agreement && enrol.agreement.institution ? enrol.agreement.institution : enrol.certificate.ref.agreement ? enrol.certificate.ref.agreement.institution : ''
      info.modality = enrol && enrol.modality
      info.score = enrol && enrol.certificate && enrol.certificate.ref ? enrol.certificate.ref.score : ''
      info.code = enrol && enrol.certificate && enrol.certificate.ref ? enrol.certificate.ref.shortCode : ''
      info.delivery = enrol && enrol.shipping && enrol.shipping.date 
      info.shippingFirstName = enrol && enrol.shipping && enrol.shipping.firstName
      info.shippingLastName = enrol && enrol.shipping && enrol.shipping.lastName
      info.shippingDni = enrol && enrol.shipping && enrol.shipping.dni
      info.shippingCellPhone = enrol && enrol.shipping && enrol.shipping.cellphone
      info.shippingAddress = enrol && enrol.shipping && enrol.shipping.address
      const appraisal = enrol && [...enrol.exams, ...enrol.tasks]
      const modules = appraisal && appraisal.sort((a, b) => a.name.split(" ")[1] - b.name.split(" ")[1])
      modules && modules.forEach(
        (mod, index) => mod.score && (info['mod' + (index + 1)] = mod.score)
      )
      return info
    })
    return res.status(200).json(filter)
  } catch (error) {
    next(error)
  }
}

const listGeneral = async (req, res, next) => {
  try {
    const enrols = await service.listGeneral(req.query)
    return res.status(200).json(enrols)
  } catch (error) {
    next(error)
  }
}

const sendEnrolEmail = async (req, res, next) => {
  try {
    const enrol = await service.createEmailEnrol(req.body)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const getEnrolCertificate = async (req, res, next) => {
  try {
    const enrol = await service.getEnrolCertificate(req.query)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const sendEnrolCertificate = async (req, res, next) => {
  try {
    const enrol = await service.sendEnrolCertificate(req.body)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const createEnrol = async (req, res, next) => {
  try {
    const enrol = await service.createEnrol(req.body, req.user)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const listEnrolsAgreements = async (req, res, next) => {
  const params = JSON.parse(req.query.query)
  try {
    const enrols = await service.listEnrolsAgreements(params, req.user)
    return res.status(200).json(enrols)
  } catch (error) {
    next(error)
  }
}

const updateEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  try {
    const enrol = await service.updateEnrol(enrolId, req.body, req.user)
    return res.status(200).json(enrol)
  } catch (error) {
    next(error)
  }
}

const updateMoodleEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  
  try {
    const enrol = await service.updateMoodle(enrolId, req.body, req.user)
    return res.status(200).json(enrol)
  } catch (error) {
    next(error)
  }
}

const detailEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = enrolId
  } else {
    params.query = {
      _id: enrolId
    }
  }

  try {
    const enrol = await service.detailEnrol(params)
    return res.status(200).json(enrol)
  } catch (error) {
    next(error)
  }
}

const deleteEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  try {
    const enrol = await service.deleteEnrol(enrolId, req.user)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listEnrols,
  listEnrolsAgreements,
  listRatings,
  listGeneral,
  createEnrol,
  updateEnrol,
  updateMoodleEnrol,
  detailEnrol,
  deleteEnrol,
  sendEnrolEmail,
  getEnrolCertificate,
  sendEnrolCertificate
}
