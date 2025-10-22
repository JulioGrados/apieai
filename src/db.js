'use strict'

const dbModule = require('db')
const config = require('config')

const { models, db } = dbModule(config.db)

db.connect()

module.exports = models
