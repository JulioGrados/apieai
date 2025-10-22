'use strict'

const { Router } = require('express')
const Api = require('../controllers/certificates')

const router = new Router()

router.route('/certificates/count').get(Api.countDocuments)

router
  .route('/certificates')
  .get(Api.listCertificates)
  .post(Api.createCertificate)

router
  .route('/certificates/deal/agreements')
  .get(Api.listDealAgreements)

router
  .route('/certificates/admin')
  .post(Api.createAdminCertificate)

router
  .route('/certificates/:id')
  .get(Api.detailCertificate)
  .put(Api.updateCertificate)
  .delete(Api.deleteCertificate)

router
  .route('/certificates/admin/:id')
  .put(Api.updateAdminCertificate)


module.exports = router
