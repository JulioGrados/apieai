'use strict'

const service = require('../services/call')

const listCalls = async (req, res) => {
  const calls = await service.listCalls(req.query)
  return res.status(200).json(calls)
}

const createCall = async (req, res, next) => {
  try {
    const call = await service.createCall(req.body, req.call)
    return res.status(201).json(call)
  } catch (error) {
    next(error)
  }
}

const updateCall = async (req, res, next) => {
  const callId = req.params.id

  try {
    const call = await service.updateCall(callId, req.body, req.user)
    return res.status(200).json(call)
  } catch (error) {
    next(error)
  }
}

const detailCall = async (req, res, next) => {
  const callId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = callId
  } else {
    params.query = {
      _id: callId
    }
  }

  try {
    const call = await service.detailCall(params)
    return res.status(200).json(call)
  } catch (error) {
    next(error)
  }
}

const deleteCall = async (req, res, next) => {
  const callId = req.params.id
  try {
    const call = await service.deleteCall(callId, req.call)
    return res.status(201).json(call)
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
  listCalls,
  createCall,
  updateCall,
  detailCall,
  deleteCall
}
