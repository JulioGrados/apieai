'use strict'

const { Router } = require('express')
const Api = require('../controllers/charge')

const router = new Router()

router.route('/charge/count').get(Api.countDocuments)

router
  .route('/charge')
  .get(Api.listCharges)
  .post(Api.createCharge)

router
  .route('/charge/:id')
  .get(Api.detailCharge)
  .put(Api.updateCharge)
  .delete(Api.deleteCharge)

module.exports = router
