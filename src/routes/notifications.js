'use strict'

const { Router } = require('express')
const Api = require('../controllers/notifications')

const router = new Router()

router.route('/notifications/count').get(Api.countDocuments)

router
  .route('/notifications')
  .get(Api.listNotifications)
  .post(Api.createNotification)

router
  .route('/notifications/:id')
  .get(Api.detailNotification)
  .put(Api.updateNotification)
  .delete(Api.deleteNotification)

module.exports = router
