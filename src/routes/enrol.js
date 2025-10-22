'use strict'

const { Router } = require('express')
const Api = require('../controllers/enrols')

const router = new Router()

router.route('/enrols/count').get(Api.countDocuments)
router.route('/enrols/send').post(Api.sendEnrolEmail)
router
  .route('/enrols/certificate')
  .get(Api.getEnrolCertificate)
  .post(Api.sendEnrolCertificate)

router
  .route('/enrols')
  .get(Api.listEnrols)
  .post(Api.createEnrol)

router
  .route('/enrols/ratings')
  .get(Api.listRatings)

router
  .route('/enrols/general')
  .get(Api.listGeneral)

router
  .route('/enrols/agreements')
  .get(Api.listEnrolsAgreements)

router
  .route('/enrols/:id')
  .get(Api.detailEnrol)
  .put(Api.updateEnrol)
  .delete(Api.deleteEnrol)

router
  .route('/enrols/migrate/:id')
  .put(Api.updateMoodleEnrol)

module.exports = router
