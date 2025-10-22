'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const morgan = require('morgan')
const config = require('config')

const routes = require('./routes')
const routesOpen = require('./routes/open')

const Sentry = require("@sentry/node")
const Tracing = require("@sentry/tracing")

const { authHandler } = require('./auth')

const server = express()

Sentry.init({
  dsn: "https://f8ecda879746464c8a65fb5118ad664f@o667393.ingest.sentry.io/5766631",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ server }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
server.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
server.use(Sentry.Handlers.tracingHandler());

server.use(
  fileUpload({
    createParentPath: true
  })
)

server.use(
  bodyParser.json({
    limit: '100mb',
    extended: true
  })
)

server.use(
  bodyParser.urlencoded({
    limit: '100mb',
    extended: true,
    parameterLimit: 500000
  })
)

const corsOpts = {
  origin: '*',

  methods: ['GET', 'POST'],

  allowedHeaders: ['Content-Type']
}

server.use(morgan('dev'))
server.use(cors())

routesOpen(server)
server.use(authHandler)
routes(server)

server.use(Sentry.Handlers.errorHandler())

server.use((error, request, response, next) => {
  // if (err.status && err.message) {
  //   return err
  // }
  if (error) {
    const errors = []
    console.error(error)
    if (error.name === 'ValidationError') {
      
      if (error.errors) {
        for (const field in error.errors) {
          errors.push(error.errors[field])
        }
      }
      error.message = errors[0] ? errors[0].message : 'Error en la base de datos'
      // error.status = 402
      return response.status(402).json(error)
    } else if (error.name === 'InvalidError') {
      error.message = error.message ? error.message : 'Error en la base de datos.'
      // error.status = 500
      return response.status(402).json(error)
    } else if (error.name === 'MongoError') {
      error.message = error.message ? error.message : 'Error en la base de datos.'
      // error.status = 500
      return response.status(500).json(error)
    } else if (error.name === 'CastError') {
      error.message = error.message ? error.message : 'Error en la base de datos.'
      // error.status = 500
      return response.status(404).json(error)
    } else {
      error.message = error.message ? error.message : '!Ups ocurrio un error en el servidor¡'
      // error.status = 500
      return response.status(500).json(error)
    }
  }
})

module.exports = server
