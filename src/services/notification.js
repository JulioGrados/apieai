'use strict'

const { notificationDB } = require('db/lib')

const listNotifications = async params => {
  const notifications = await notificationDB.list(params)
  return notifications
}

const createNotification = async (body, loggedUser) => {
  const notification = await notificationDB.create(body)
  return notification
}

const updateNotification = async (notificationId, body, loggedUser) => {
  const notification = await notificationDB.update(notificationId, body)
  return notification
}

const detailNotification = async params => {
  const notification = await notificationDB.detail(params)
  return notification
}

const deleteNotification = async (notificationId, loggedUser) => {
  const notification = await notificationDB.remove(notificationId)
  return notification
}

const countDocuments = async params => {
  const count = await notificationDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listNotifications,
  createNotification,
  updateNotification,
  detailNotification,
  deleteNotification
}
