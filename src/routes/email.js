'use strict'

const { Router } = require('express')
const Api = require('../controllers/emails')

const router = new Router()

router.route('/emails/count').get(Api.countDocuments)

router
  .route('/emails')
  .get(Api.listEmails)
  .post(Api.createEmail)

router
  .route('/emails/admin')
  .post(Api.resendEmail)

router
  .route('/create/emails')
  .post(Api.createSendEmail)

router
  .route('/emails/search')
  .get(Api.searchEmails)

router
  .route('/emails/:id')
  .get(Api.detailEmail)
  .put(Api.updateEmail)
  .delete(Api.deleteEmail)

router
  .route('/emails/envio/admin')
  .post(Api.sendEmail)

module.exports = router
