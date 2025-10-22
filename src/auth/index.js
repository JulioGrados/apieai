'use strict'

const jwt = require('jsonwebtoken')
const config = require('config')

const authHandler = (req, res, next) => {
  const token =
    req.headers['x-access-token'] || req.body.token || req.query.token
  if (token) {
    jwt.verify(token, config.auth.secret, (err, decoded) => {
      if (err) {
        res.status(401).json({
          success: false,
          message: 'Failed to authenticate token.'
        })
        return
      }
      req.user = decoded
      return next()
    })
  } else {
    res.status(401).send({
      success: false,
      message: 'No token provided.'
    })
  }
}

const socketHandler = (socket, next) => {
  const token = socket.handshake.query.token
  if (token) {
    jwt.verify(token, config.auth.secret, (err, decoded) => {
      if (err) {
        socket.disconnect()
        return next(new Error('authentication error'))
      }
      socket.assessor = decoded
      return next()
    })
  } else {
    socket.disconnect()
    return next(new Error('authentication error'))
  }
}

module.exports = {
  authHandler,
  socketHandler
}
