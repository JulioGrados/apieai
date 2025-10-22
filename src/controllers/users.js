'use strict'

const service = require('../services/user')
const countriesData = require('utils/functions/countries')

const listUsers = async (req, res) => {
  const users = await service.listUsers(req.query)
  return res.status(200).json(users)
}

const createUser = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.photo
  try {
    const user = await service.createUser(body, file, req.user)
    return res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}

const updateUser = async (req, res, next) => {
  const userId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.photo
  try {
    const user = await service.updateUser(userId, body, file, req.user)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const updateUserStage = async (req, res, next) => {
  const userId = req.params.id
  try {
    const user = await service.updateUserStage(userId, req.body, req.user)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const updateDniUser = async (req, res, next) => {
  const userId = req.params.id
  try {
    const user = await service.updateDniUser(userId, req.body, req.user)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const updateAccountUser = async (req, res, next) => {
  const userId = req.params.id
  try {
    const user = await service.updateAccountUser(userId, req.body, req.user)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const updateAccountUserMoodle = async (req, res, next) => {
  const userId = req.params.id
  try {
    const user = await service.updateAccountUserMoodle(userId, req.body, req.user)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const updatePhotoUser = async (req, res, next) => {
  const userId = req.params.id
  try {
    const user = await service.updatePhotoUser(userId, req.body, req.user)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const detailUser = async (req, res, next) => {
  const userId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = userId
  } else {
    params.query = {
      _id: userId
    }
  }

  try {
    const user = await service.detailUser(params)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const deleteUser = async (req, res, next) => {
  const userId = req.params.id
  try {
    const user = await service.deleteUser(userId, req.user)
    return res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

// Open Controllers
const listTeachers = async (req, res) => {
  const params = {
    ...req.query,
    select: 'names firstName lastName description photo country username'
  }
  const users = await service.listUsers(params)
  return res.status(200).json(users)
}

const searchCodeNumber = number => {
  let code = number.substring(0, 2)
  let country 
  do {
    country = countriesData.find(item => item.callingCode === code)
    if (!country) {
      code = number.substring(0, code.length + 1)
    }
  } while (code.length < 5 && !country)

  return {code, country}
}

const detailOpenTeacher = async (req, res, next) => {
  try {
    const user = await service.detailOpenTeacher(req.query)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const detailOpenUser = async (req, res, next) => {
  let userId
  const params = req.query
  
  if (params && params.params) {
    const paramsID = JSON.parse(params.params)
    userId = paramsID.id
  }

  if (userId) {
    if (params.query) {
      params.query._id = userId
    } else {
      params.query = {
        _id: userId
      }
    }
  }

  // if (params.query && userId) {
  //   params.query._id = userId
  // } else if (userId) {
  //   params.query = {
  //     _id: userId
  //   }
  // }

  try {
    const user = await service.detailOpenUser(params)
    return res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

const createOrUpdateUser = async (req, res, next) => {
  const body = req.body
  console.log('req.body', req.body)
  try {
    if (body.source && body.source === 'Facebook') {
      const number = body.phone && body.phone.charAt(0) === '+' ? body.phone.substring(1) : body.phone
      const phone = number && number.length > 6 ? searchCodeNumber(number) : number
      
      if (!phone.country) {
        body.mobile = number ? number : ''
        body.mobile = body.mobile.replace(/ /g, '')
      } else {
        body.mobileCode = phone ? phone.code : ''
        body.mobile = number ? number.replace(phone.code, '') : ''
        body.mobile = body.mobile.replace(/ /g, '')
        body.country = phone ? phone.country && phone.country.name : ''
      }
    } 
    const user = await service.createOrUpdateUser(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error', error)
    next(error)
  }
}

const createOrUpdateUserRegister = async (req, res, next) => {
  const body = req.body
  console.log('req.body', req.body)
  try {
    const user = await service.addOrUpdateUserRegister(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error--------------------', error)
    next(error)
  }
}

const addOrUpdateUser = async (req, res, next) => {
  const body = req.body
  console.log('req.body', req.body)
  try {
    if (body.source && body.source === 'Facebook') {
      const number = body.phone && body.phone.charAt(0) === '+' ? body.phone.substring(1) : body.phone
      const phone = number && number.length > 6 ? searchCodeNumber(number) : number
      
      if (!phone.country) {
        body.mobile = number ? number : ''
        body.mobile = body.mobile.replace(/ /g, '')
      } else {
        body.mobileCode = phone ? phone.code : ''
        body.mobile = number ? number.replace(phone.code, '') : ''
        body.mobile = body.mobile.replace(/ /g, '')
        body.country = phone ? phone.country && phone.country.name : ''
      }
    }
    body.source = body.origin
    const user = await service.addOrUpdateUser(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error--------------------', error)
    next(error)
  }
}

const createStudent = async (req, res, next) => {
  const body = req.body
  try {
    const user = await service.createStudent(body)
    return res.status(201).json(user)
  } catch (error) {
    // console.log('error', error)
    next(error)
  }
}

const createDealUser = async (req, res, next) => {
  const body = req.body
  try {
    console.log('body', body)
    const user = await service.createDealUser(body)
    return res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}

const recoverPassword = async (req, res, next) => {
  const body = req.body
  try {
    const user = await service.recoverPassword(body)
    return res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  countDocuments,
  listUsers,
  createUser,
  createDealUser,
  updateUser,
  updateUserStage,
  updateDniUser,
  updateAccountUser,
  updateAccountUserMoodle,
  searchCodeNumber,
  updatePhotoUser,
  detailUser,
  detailOpenUser,
  detailOpenTeacher,
  deleteUser,
  listTeachers,
  createOrUpdateUser,
  createOrUpdateUserRegister,
  addOrUpdateUser,
  recoverPassword,
  createStudent
}
