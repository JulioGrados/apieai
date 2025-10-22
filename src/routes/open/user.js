'use strict'

const { Router } = require('express')
const Api = require('../../controllers/users')

const router = new Router()

router.route('/teachers').get(Api.listTeachers)
router.route('/teachers/detail').get(Api.detailOpenTeacher)
router.route('/users').post(Api.createOrUpdateUser)
router.route('/users/detail').get(Api.detailOpenUser)
router.route('/users/register').post(Api.createOrUpdateUserRegister)
router.route('/student').post(Api.createStudent)
router.route('/users/deal').post(Api.createDealUser)
router.route('/users/add').post(Api.addOrUpdateUser)
router.route('/users/count').get(Api.countDocuments)
router.route('/users/recover').post(Api.recoverPassword)

module.exports = router
