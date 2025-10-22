'use strict'

const { Router } = require('express')
const Api = require('../controllers/migrations')
const { isAdmin } = require('../auth/permissions')

const router = new Router()

router.route('/migrations/courses').post(isAdmin, Api.migrateCourses)

router.route('/migrations/users/moodle').post(isAdmin, Api.migrateMoodleUsers)
router
  .route('/migrations/courses/moodle')
  .post(isAdmin, Api.migrateMoodleCourses)
router.route('/migrations/enrol/moodle').post(isAdmin, Api.migrateMoodleEnroll)

router.route('/migrations/quiz/moodle').post(isAdmin, Api.migrateQuizMoodle)
router.route('/migrations/tasks/moodle').post(isAdmin, Api.migrateTaskMoodle)
router
  .route('/migrations/evaluations/moodle')
  .post(isAdmin, Api.migrateMoodleEvaluations)

router
  .route('/migrations/certificates/moodle')
  .post(isAdmin, Api.migrateCertificates)

router
  .route('/migrations/admin/certificates')
  .post(Api.migrateAdminCertificates)

router
  .route('/migrations/admin/sales')
  .post(Api.migrateAdminSales)

module.exports = router
