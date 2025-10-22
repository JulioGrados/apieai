'use strict'

const service = require('../services/message')

const listMessages = async (req, res) => {
  const messages = await service.listMessages(req.query)
  return res.status(200).json(messages)
}

const createMessage = async (req, res, next) => {
  try {
    const message = await service.createMessage(req.body, req.message)
    return res.status(201).json(message)
  } catch (error) {
    next(error)
  }
}

const updateMessage = async (req, res, next) => {
  const messageId = req.params.id
  try {
    const message = await service.updateMessage(
      messageId,
      req.body,
      req.message
    )
    return res.status(200).json(message)
  } catch (error) {
    next(error)
  }
}

const detailMessage = async (req, res, next) => {
  const messageId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = messageId
  } else {
    params.query = {
      _id: messageId
    }
  }

  try {
    const message = await service.detailMessage(params)
    return res.status(200).json(message)
  } catch (error) {
    next(error)
  }
}

const deleteMessage = async (req, res, next) => {
  const messageId = req.params.id
  try {
    const message = await service.deleteMessage(messageId, req.message)
    return res.status(201).json(message)
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
  listMessages,
  createMessage,
  updateMessage,
  detailMessage,
  deleteMessage
}
