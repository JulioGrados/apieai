'use strict'

const { Router } = require('express')
const Api = require('../controllers/contacts')

const router = new Router()

router.route('/contacts/count').get(Api.countDocuments)

router
  .route('/contacts')
  .get(Api.listContacts)
  .post(Api.createContact)

router
  .route('/contacts/:id')
  .get(Api.detailContact)
  .put(Api.updateContact)
  .delete(Api.deleteContact)

module.exports = router
