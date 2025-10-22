'use strict'

const { searchUsername, searchEmail, enrolCourseMoodle } = require('utils/functions/moodle')
const { confirmationDB, userDB, enrolDB } = require('db/lib')
let randomize = require('randomatic')
const { createNewUserMoodle } = require('../functions/createNewUserMoodle')
const { createEmailOnly } = require('./email')
const { sendEmail, sendEmailOnly } = require('utils/lib/sendgrid')
const { sendAccount, sendError } = require('../functions/email/templates')

const listConfirmations = async params => {
  const confirmations = await confirmationDB.list(params)
  return confirmations
}

const createConfirmation = async (body, loggedConfirmation) => {
  const confirmation = await confirmationDB.create(body)
  return confirmation
}

const updateConfirmation = async (confirmationId, body, loggedConfirmation) => {
  const confirmation = await confirmationDB.update(confirmationId, body)
  return confirmation
}

const detailConfirmation = async params => {
  const confirmation = await confirmationDB.detail(params)
  return confirmation
}

const detailOpenConfirmation = async params => {
  const confirmation = await confirmationDB.detail(params)
  return confirmation
}

const detailOpenActivation = async (confirmationId, body) => {
  const confirmation = await confirmationDB.update(confirmationId, body)
  const { user, course } = await confirmationDB.detail({
    query: { _id: confirmation._id.toString() },
    populate: ['user', 'course']
  })
  console.log('user', user)
  console.log('course', course)
  const username = `${user.email}`
  const existUsername = await searchUsername({
    username: username
  })
  console.log('existUsername', existUsername)
  const existEmail = await searchEmail({
    email: user.email
  })
  console.log('existUsername', existUsername)
  console.log('existEmail', existEmail)
  const code = randomize('0', 8)
  if (existUsername && existEmail) {
    if (existUsername.id === existEmail.id) {
      const msg = sendError('Cuenta existente', user.firstName, user.lastName, user.dni, user.mobile, user.email)
      const email = await createEmailOnly(msg)
      const emailUser = await sendEmailOnly(msg)
    } else {
      const msg = sendError('Username existente', user.firstName, user.lastName, user.dni, user.mobile, user.email)
      const email = await createEmailOnly(msg)
      const emailUser = await sendEmailOnly(msg)
    }
  } else {
    if (!existUsername && existEmail) {
      const msg = sendError('Email existente', user.firstName, user.lastName, user.dni, user.mobile, user.email)
      const email = await createEmailOnly(msg)
      const emailUser = await sendEmailOnly(msg)
    } else if (existUsername && !existEmail) { 
      const msg = sendError('Username existente', user.firstName, user.lastName, user.dni, user.mobile, user.email)
      const email = await createEmailOnly(msg)
      const emailUser = await sendEmailOnly(msg)
    } else {
      try {
        console.log('user', user)
        const userCreateData = {
          ...user.toJSON(),
          username: username,
          password: code
        }
        console.log('userCreateData', userCreateData)
        const moodleUser = await createNewUserMoodle(userCreateData)
        const dataUser = {
          username: username,
          password: code,
          moodleId: moodleUser.id
        }
        const userCreate = await userDB.update(user._id, dataUser)
        const enroll = {
          roleid: '5',
          userid: parseInt(moodleUser.id),
          courseid: parseInt(course.moodleId)
        }
        const msg = sendAccount(course.name, user.firstName, user.email, username, code)
        const email = await createEmailOnly(msg)
        const emailUser = await sendEmailOnly(msg)
        await enrolCourseMoodle(enroll)
        const enrol = await enrolDB.create({
          linked: {
            ...user.toJSON(),
            ref: user
          },
          course: {
            ...course.toJSON(),
            ref: course
          }
        })
      } catch (error) {
        const msg = sendError('Error matricula en moodle', user.firstName, user.lastName, user.dni, user.mobile, user.email)
        const email = await createEmailOnly(msg)
        const emailUser = await sendEmailOnly(msg)
      }
    }
  }
  return confirmation
}

const deleteConfirmation = async (confirmationId, loggedConfirmation) => {
  const confirmation = await confirmationDB.remove(confirmationId)
  return confirmation
}

const countDocuments = async params => {
  const count = await confirmationDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listConfirmations,
  createConfirmation,
  updateConfirmation,
  detailConfirmation,
  detailOpenConfirmation,
  detailOpenActivation,
  deleteConfirmation
}
