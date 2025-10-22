'use strict'

const service = require('../services/log')

const listLogs = async (req, res) => {
  const logs = await service.listLogs(req.query)
  return res.status(200).json(logs)
}

const createLog = async (req, res, next) => {
  try {
    const log = await service.createLog(req.body, req.user)
    return res.status(201).json(log)
  } catch (error) {
    next(error)
  }
}

const updateLog = async (req, res, next) => {
  const logId = req.params.id
  try {
    const log = await service.updateLog(logId, req.body, req.user)
    return res.status(200).json(log)
  } catch (error) {
    next(error)
  }
}

const detailLog = async (req, res, next) => {
  const logId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = logId
  } else {
    params.query = {
      _id: logId
    }
  }

  try {
    const log = await service.detailLog(params)
    return res.status(200).json(log)
  } catch (error) {
    next(error)
  }
}

const deleteLog = async (req, res, next) => {
  const logId = req.params.id
  try {
    const log = await service.deleteLog(logId, req.user)
    return res.status(201).json(log)
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
  listLogs,
  createLog,
  updateLog,
  detailLog,
  deleteLog
}
