'use strict'

const service = require('../services/notification')

const listNotifications = async (req, res) => {
  const notifications = await service.listNotifications(req.query)
  return res.status(200).json(notifications)
}

const createNotification = async (req, res, next) => {
  try {
    const whatsapp = await service.createNotification(req.body, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const updateNotification = async (req, res, next) => {
  const notificationId = req.params.id
  try {
    const whatsapp = await service.updateNotification(
      notificationId,
      req.body,
      req.whatsapp
    )
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const detailNotification = async (req, res, next) => {
  const notificationId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = notificationId
  } else {
    params.query = {
      _id: notificationId
    }
  }

  try {
    const whatsapp = await service.detailNotification(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const deleteNotification = async (req, res, next) => {
  const notificationId = req.params.id
  try {
    const notification = await service.deleteNotification(
      notificationId,
      req.whatsapp
    )
    return res.status(201).json(notification)
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
  listNotifications,
  createNotification,
  updateNotification,
  detailNotification,
  deleteNotification
}
