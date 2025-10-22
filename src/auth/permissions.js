'use strict'

const isAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.roles.includes('Administrador')) {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de administrador.'
  })
}

const isTeacher = (req, res, next) => {
  if (req.user) {
    if (req.user.roles.includes('Docente')) {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de docente.'
  })
}

const isStudent = (req, res, next) => {
  if (req.user) {
    if (req.user.roles.includes('Estudiante')) {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No eres estudiante.'
  })
}

const isClient = (req, res, next) => {
  if (req.user) {
    if (req.user.roles.includes('Cliente')) {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de cliente.'
  })
}

const isAssessor = (req, res, next) => {
  if (req.user) {
    if (req.user.roles.includes('Asesor')) {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de Asesor.'
  })
}

module.exports = {
  isAdmin,
  isTeacher,
  isStudent,
  isClient,
  isAssessor
}
