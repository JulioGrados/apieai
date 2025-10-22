'use strict'

const service = require('../services/chat')

const listChats = async (req, res) => {
  const chats = await service.listChats(req.query)
  return res.status(200).json(chats)
}

const createChat = async (req, res, next) => {
  try {
    const chat = await service.createChat(req.body, req.chat)
    return res.status(201).json(chat)
  } catch (error) {
    next(error)
  }
}

const updateChat = async (req, res, next) => {
  const chatId = req.params.id
  try {
    const chat = await service.updateChat(
      chatId,
      req.body,
      req.chat
    )
    return res.status(200).json(chat)
  } catch (error) {
    next(error)
  }
}

const detailChat = async (req, res, next) => {
  const chatId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = chatId
  } else {
    params.query = {
      _id: chatId
    }
  }

  try {
    const chat = await service.detailChat(params)
    return res.status(200).json(chat)
  } catch (error) {
    next(error)
  }
}

const deleteChat = async (req, res, next) => {
  const chatId = req.params.id
  try {
    const chat = await service.deleteChat(chatId, req.chat)
    return res.status(201).json(chat)
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
  listChats,
  createChat,
  updateChat,
  detailChat,
  deleteChat
}
