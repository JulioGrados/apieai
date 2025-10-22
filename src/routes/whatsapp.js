'use strict'

const { Router } = require('express')
const Api = require('../controllers/whatsapp')

const router = new Router()

router.route('/whatsapps/count').get(Api.countDocuments)

router
  .route('/whatsapps')
  .get(Api.listWhatsapps)
  .post(Api.createWhatsapp)

router
  .route('/whatsapps/:id')
  .get(Api.detailWhatsapp)
  .put(Api.updateWhatsapp)
  .delete(Api.deleteWhatsapp)

router
  .route('/whatsapps/admin')
  .post(Api.sendWhatsapp)

module.exports = router
