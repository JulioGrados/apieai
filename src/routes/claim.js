'use strict'

const { Router } = require('express')
const Api = require('../controllers/claim')

const router = new Router()

router.route('/claims/count').get(Api.countDocuments)

router
  .route('/claims')
  .get(Api.listClaims)
  .post(Api.createClaim)

router
  .route('/claims/:id')
  .get(Api.detailClaim)
  .put(Api.updateClaim)
  .delete(Api.deleteClaim)

module.exports = router
