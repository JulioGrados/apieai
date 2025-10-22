'use strict'

const { Router } = require('express')
const Api = require('../controllers/deals')

const router = new Router()

router.route('/deals/count').get(Api.countDocuments)
router.route('/deal/enrol').post(Api.enrolDeal)

router
  .route('/deals')
  .get(Api.listDeals)
  .post(Api.createDeal)

router
  .route('/deals/general')
  .get(Api.generalDeals)

router
  .route('/deals/assessor')
  .get(Api.assessorDeals)

router
  .route('/deals/search')
  .get(Api.searchDeals)

router
  .route('/deals/dash')
  .get(Api.dashDeals)

router
  .route('/deals/admin/:id')
  .put(Api.updateDealOne)

router
  .route('/deals/:id')
  .get(Api.detailDeal)
  .put(Api.updateDeal)
  .delete(Api.deleteDeal)

router
  .route('/deals/course/:id')
  .put(Api.updateDealCourse)

router
  .route('/deals/winner/:id')
  .put(Api.updateWinner)

router
  .route('/deals/mix')
  .post(Api.mixDeal)

router
  .route('/deals/change')
  .post(Api.changeDeal)

router
  .route('/deals/reasign')
  .post(Api.reasignDeal)

module.exports = router
