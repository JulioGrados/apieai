const { Router } = require('express')
const Api = require('../../controllers/deals')

const router = new Router()

router
  .route('/deals/detail')
  .get(Api.searchOpenDetail)

module.exports = router