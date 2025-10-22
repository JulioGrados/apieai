const { userDB } = require("../db")
const { createUserMoodle } = require("utils/functions/moodle")
const CustomError = require('custom-error-instance')

const createNewUserMoodle = async (user) => {

  const dataUser = {
    email: user.email,
    firstname: user.firstName,
    lastname: user.lastName,
    username: user.username,
    password: user.password
  }
  console.log('dataUser', dataUser)
  const userMoodle = await createUserMoodle(dataUser) // utils
    
  console.log('userMoodle', userMoodle)
  if (userMoodle && userMoodle.length) {
    await userDB.update(user._id, { moodleId: userMoodle[0].id })
  } else {
    const InvalidError = CustomError('CastError', { message: 'No se pudo crear el usuario de Moodle, por un parametro invalido', code: 'EINVLD' }, CustomError.factory.expectReceive)
    throw new InvalidError()
  }
  return userMoodle[0]
}

module.exports = {
  createNewUserMoodle
}