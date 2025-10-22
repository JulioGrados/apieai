'use strict'

const { Router } = require('express')
const Api = require('../controllers/moodle')

const router = new Router()

router.route('/moodle/user').post(Api.createUser)
router.route('/moodle/certificates').post(Api.createCertificates)
router.route('/migrations/users').post(Api.migrateUsers)
router.route('/migrations/grades').post(Api.migrateGrades)
router.route('/migrations/evaluations').post(Api.migrateEvaluations)
router.route('/migrations/enrols').post(Api.migrateEnrols)
router.route('/migrations/certificates').post(Api.migrateCertificates)
router.route('/migrations/course').post(Api.enrrollUser)
router.route('/migrations/lessons').post(Api.createModulesCourse)
router.route('/migrate/testimonies').post(Api.migrateTestimonies)
router.route('/migrate/shippings').post(Api.migrateShipping)
// router.route('/migrations/modules').get(Api.createModulesCourse)

module.exports = router
