'use strict'

const jwt = require('jsonwebtoken')
const config = require('config')
const { comparePass } = require('utils').auth

const { userDB } = require('../db')

const loginUser = async (username, password) => {
  if (!username || !password) {
    const error = {
      status: 400,
      message: 'Necesitas un username y una contraseña.'
    }
    throw error
  }

  const select =
    'username names email mobile firstName lastName roles password zadarma photo stage'

  let user = null

  user = await userDB.detail({
    query: {
      username
    },
    select
  })

  if (!user) {
    const error = {
      status: 401,
      message: 'El usuario no existe.'
    }

    throw error
  }

  const passCorrect = comparePass(password, user.password)
  if (!passCorrect) {
    const error = {
      status: 401,
      message: 'Los datos de acceso son incorrectos.'
    }
    throw error
  }

  delete user.password

  const token = jwt.sign(user.toJSON(), config.auth.secret, {
    expiresIn: '1y'
  })

  const respuesta = {
    token,
    user
  }

  return respuesta
}

module.exports = {
  loginUser
}
