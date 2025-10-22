'use strict'

const { Router } = require('express')
const Api = require('../controllers/users')
const { isAdmin } = require('../auth/permissions')

const router = new Router()

router.route('/users/count').get(Api.countDocuments)

router
  .route('/users')
  .get(Api.listUsers)
  .post(Api.createUser)

router
  .route('/users/:id')
  .get(Api.detailUser)
  .put(Api.updateUser)
  .delete(isAdmin, Api.deleteUser)

router
  .route('/users/dni/:id')
  .put(Api.updateDniUser)

router
  .route('/users/account/:id')
  .put(Api.updateAccountUser)

router
  .route('/users/account/moodle/:id')
  .put(Api.updateAccountUserMoodle)

router
  .route('/users/photo/:id')
  .put(Api.updatePhotoUser)

router
  .route('/users/stage/:id')
  .put(Api.updateUserStage)

module.exports = router
