const CronJob = require('cron').CronJob
const path = require('path')

const { readFile } = require('utils/files/read')
const { readFileCsv } = require('utils/files/csv')
const { getDelayCalls, deleteFilesAudio, listCallsGoogle, uploadCallAudio } = require('../services/call')

const {
  createUserCertificate,
  createEnrolID,
  gradesCron,
  enrolCron,
  certificateCron,
  createPdfStudent,
  sendEmailStudent,
  deleteFilesPdf,
  examInModules
} = require('../services/moodle')

const { createAddressEnrol } = require('../services/enrol')
const { portfolioFile } = require('utils/functions/portfolio')
const { countDocuments, listCourses } = require('../services/course')
const { saveTokenZadarma } = require('../services/user')
const { csv2json } = require('utils/functions/csv')
const { orderCourseEvaluations, migrationCourseEvaluations } = require('../services/migration')

const job = new CronJob(
  '0 55 2 * * *',
  getDelayCalls,
  null,
  true,
  'America/Bogota'
)
job.start()

// // score upload
// const scoreone = new CronJob('0 0 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/72.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 72)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreone.start()

// const scoretwo = new CronJob('0 2 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/167.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 167)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoretwo.start()

// const scorethree = new CronJob('0 4 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/90.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 90)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorethree.start()

// const scorefour = new CronJob('0 6 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/57.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 57)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorefour.start()

// const scorefive = new CronJob('0 8 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/129.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 129)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorefive.start()

// const scoresix = new CronJob('0 10 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/93.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 93)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresix.start()

// const scoreseven = new CronJob('0 12 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/65.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 65)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseven.start()

// const scoreseight = new CronJob('0 14 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/142.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 142)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseight.start()

// const scoresnine = new CronJob('0 16 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/135.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 135)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresnine.start()

// const scoresten = new CronJob('0 18 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/107.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 107)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresten.start()

// const scoreseleven = new CronJob('0 20 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/50.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 50)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseleven.start()

// const scorestwelve = new CronJob('0 22 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/47.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 47)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwelve.start()

// const scoresthirteen = new CronJob('0 24 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/69.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 69)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirteen.start()

// const scoresfourteen = new CronJob('0 26 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/38.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 38)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourteen.start()

// const scoresfiveteen = new CronJob('0 28 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/96.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 96)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiveteen.start()

// const scoressixteen = new CronJob('0 30 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/109.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 109)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixteen.start()

// const scoresseventeen = new CronJob('0 32 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/66.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 66)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventeen.start()

// const scoreseightteen = new CronJob('0 34 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/68.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 68)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightteen.start()

// const scoresnineteen = new CronJob('0 36 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/25.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 25)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresnineteen.start()

// const scorestwenty = new CronJob('0 38 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/28.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 28)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwenty.start()

// const scorestwentyone = new CronJob('0 40 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/186.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 186)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentyone.start()

// const scorestwentytwo = new CronJob('0 42 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/166.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 166)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentytwo.start()

// const scorestwentythree = new CronJob('0 44 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/79.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 79)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentythree.start()

// const scorestwentyfour = new CronJob('0 46 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/175.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 175)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentyfour.start()

// const scorestwentyfive = new CronJob('0 48 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/146.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 146)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentyfive.start()

// const scorestwentysix = new CronJob('0 50 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/102.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 102)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentysix.start()

// const scorestwentyseven = new CronJob('0 52 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/137.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 137)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentyseven.start()

// const scorestwentyeight = new CronJob('0 54 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/113.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 113)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentyeight.start()

// const scorestwentynine = new CronJob('0 56 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/44.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 44)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scorestwentynine.start()

// const scoresthirty = new CronJob('0 58 3 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/196.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 196)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirty.start()

// const scoresthirtyone = new CronJob('0 0 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/23.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 23)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtyone.start()

// const scoresthirtytwo = new CronJob('0 2 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/174.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 174)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtytwo.start()

// const scoresthirtythree = new CronJob('0 4 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/134.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 134)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtythree.start()

// const scoresthirtyfour = new CronJob('0 6 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/43.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 43)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtyfour.start()

// const scoresthirtyfive = new CronJob('0 8 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/173.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 173)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtyfive.start()

// const scoresthirtysix = new CronJob('0 10 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/58.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 58)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtysix.start()

// const scoresthirtyseven = new CronJob('0 12 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/97.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 97)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtyseven.start()

// const scoresthirtyeight = new CronJob('0 14 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/105.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 105)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtyeight.start()

// const scoresthirtynine = new CronJob('0 16 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/188.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 188)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresthirtynine.start()

// const scoresfourty = new CronJob('0 18 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/104.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 104)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourty.start()

// const scoresfourtyone = new CronJob('0 20 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/30.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 30)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtyone.start()

// const scoresfourtytwo = new CronJob('0 22 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/45.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 45)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtytwo.start()

// const scoresfourtythree = new CronJob('0 24 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/84.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 84)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtythree.start()

// const scoresfourtyfour = new CronJob('0 26 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/71.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 71)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtyfour.start()

// const scoresfourtyfive = new CronJob('0 28 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/51.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 51)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtyfive.start()

// const scoresfourtysix = new CronJob('0 30 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/48.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 48)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtysix.start()

// const scoresfourtyseven = new CronJob('0 32 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/198.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 198)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtyseven.start()

// const scoresfourtyeight = new CronJob('0 34 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/182.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 182)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtyeight.start()

// const scoresfourtynine = new CronJob('0 36 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/81.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 81)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfourtynine.start()

// const scoresfifty = new CronJob('0 38 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/76.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 76)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfifty.start()

// const scoresfiftyone = new CronJob('0 40 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/17.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 17)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftyone.start()

// const scoresfiftytwo = new CronJob('0 42 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/157.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 157)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftytwo.start()

// const scoresfiftythree = new CronJob('0 44 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/148.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 148)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftythree.start()

// const scoresfiftyfour = new CronJob('0 46 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/91.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 91)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftyfour.start()

// const scoresfiftyfive = new CronJob('0 48 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/7.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 7)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftyfive.start()

// const scoresfiftysix = new CronJob('0 50 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/89.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 89)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftysix.start()

// const scoresfiftyseven = new CronJob('0 52 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/144.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 144)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftyseven.start()

// const scoresfiftyeight = new CronJob('0 54 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/121.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 121)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftyeight.start()

// const scoresfiftynine = new CronJob('0 56 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/8.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 8)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresfiftynine.start()

// const scoressixty = new CronJob('0 58 4 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/39.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 39)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixty.start()

// const scoressixtyone = new CronJob('0 0 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/103.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 103)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtyone.start()

// const scoressixtytwo = new CronJob('0 2 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/119.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 119)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtytwo.start()

// const scoressixtythree = new CronJob('0 4 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/141.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 141)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtythree.start()

// const scoressixtyfour = new CronJob('0 6 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/106.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 106)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtyfour.start()

// const scoressixtyfive = new CronJob('0 8 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/136.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 136)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtyfive.start()

// const scoressixtysix = new CronJob('0 10 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/185.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 185)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtysix.start()

// const scoressixtyseven = new CronJob('0 12 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/9.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 9)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtyseven.start()

// const scoressixtyeight = new CronJob('0 14 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/10.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 10)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtyeight.start()

// const scoressixtynine = new CronJob('0 16 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/151.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 151)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoressixtynine.start()

// const scoresseventy = new CronJob('0 18 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/3.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 3)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventy.start()

// const scoresseventyone = new CronJob('0 20 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/126.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 126)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventyone.start()

// const scoresseventytwo = new CronJob('0 22 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/4.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 4)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventytwo.start()

// const scoresseventythree = new CronJob('0 24 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/152.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 152)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventythree.start()

// const scoresseventyfour = new CronJob('0 26 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/77.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 77)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventyfour.start()

// const scoresseventyfive = new CronJob('0 28 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/42.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 42)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventyfive.start()

// const scoresseventysix = new CronJob('0 30 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/31.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 31)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventysix.start()

// const scoresseventyseven = new CronJob('0 32 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/54.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 54)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventyseven.start()

// const scoresseventyeight = new CronJob('0 34 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/60.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 60)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventyeight.start()

// const scoresseventynine = new CronJob('0 36 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/181.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 181)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresseventynine.start()

// const scoreseighty = new CronJob('0 38 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/83.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 83)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseighty.start()

// const scoreseightyone = new CronJob('0 40 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/95.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 95)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightyone.start()

// const scoreseightytwo = new CronJob('0 42 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/16.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 16)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightytwo.start()

// const scoreseightythree = new CronJob('0 44 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/125.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 125)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightythree.start()

// const scoreseightyfour = new CronJob('0 46 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/63.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 63)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightyfour.start()

// const scoreseightyfive = new CronJob('0 48 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/117.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 117)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightyfive.start()

// const scoreseightysix = new CronJob('0 50 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/12.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 12)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightysix.start()

// const scoreseightyseven = new CronJob('0 52 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/115.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 115)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightyseven.start()

// const scoreseightyeight = new CronJob('0 54 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/67.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 67)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightyeight.start()

// const scoreseightynine = new CronJob('0 56 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/33.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 33)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoreseightynine.start()

// const scoresninety = new CronJob('0 58 5 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/87.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 87)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninety.start()

// const scoresninetyone = new CronJob('0 0 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/59.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 59)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetyone.start()

// const scoresninetytwo = new CronJob('0 2 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/32.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 32)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetytwo.start()

// const scoresninetythree = new CronJob('0 4 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/20.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 20)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetythree.start()

// const scoresninetyfour = new CronJob('0 6 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/6.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 6)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetyfour.start()

// const scoresninetyfive = new CronJob('0 8 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/80.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 80)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetyfive.start()

// const scoresninetysix = new CronJob('0 10 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/158.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 158)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetysix.start()

// const scoresninetyseven = new CronJob('0 12 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/19.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 19)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetyseven.start()

// const scoresninetynine = new CronJob('0 14 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/64.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 64)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresninetynine.start()

// const scoresonehundredone = new CronJob('0 16 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/56.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 56)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredone.start()

// const scoresonehundredtwo = new CronJob('0 18 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/27.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 27)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwo.start()

// const scoresonehundredthree = new CronJob('0 20 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/101.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 101)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthree.start()

// const scoresonehundredfour = new CronJob('0 22 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/156.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 156)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfour.start()

// const scoresonehundredfive = new CronJob('0 24 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/165.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 165)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfive.start()

// const scoresonehundredsix = new CronJob('0 26 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/112.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 112)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsix.start()

// const scoresonehundredseven = new CronJob('0 28 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/178.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 178)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseven.start()

// const scoresonehundredeight = new CronJob('0 30 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/172.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 172)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeight.start()

// const scoresonehundrednine = new CronJob('0 32 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/171.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 171)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundrednine.start()

// const scoresonehundredten = new CronJob('0 34 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/143.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 143)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredten.start()

// const scoresonehundredeleven = new CronJob('0 36 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/143.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 143)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeleven.start()

// const scoresonehundredtwelve = new CronJob('0 38 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/29.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 29)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwelve.start()

// const scoresonehundredthirteen = new CronJob('0 40 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/130.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 130)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirteen.start()

// const scoresonehundredfourteen = new CronJob('0 42 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/164.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 164)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourteen.start()

// const scoresonehundredfiveteen = new CronJob('0 44 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/168.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 168)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiveteen.start()

// const scoresonehundredsixteen = new CronJob('0 46 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/155.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 155)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixteen.start()

// const scoresonehundredseventeen = new CronJob('0 48 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/85.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 85)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventeen.start()

// const scoresonehundredeightteen = new CronJob('0 50 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/26.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 26)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightteen.start()

// const scoresonehundrednineteen = new CronJob('0 52 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/189.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 189)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundrednineteen.start()

// const scoresonehundredtwenty = new CronJob('0 54 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/75.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 75)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwenty.start()

// const scoresonehundredtwentyone = new CronJob('0 56 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/163.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 163)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentyone.start()

// const scoresonehundredtwentytwo = new CronJob('0 58 6 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/11.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 11)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentytwo.start()

// const scoresonehundredtwentythree = new CronJob('0 0 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/114.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 114)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentythree.start()

// const scoresonehundredtwentyfour = new CronJob('0 2 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/22.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 22)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentyfour.start()

// const scoresonehundredtwentyfive = new CronJob('0 4 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/154.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 154)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentyfive.start()

// const scoresonehundredtwentysix = new CronJob('0 6 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/35.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 35)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentysix.start()

// const scoresonehundredtwentyseven = new CronJob('0 8 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/179.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 179)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentyseven.start()

// const scoresonehundredtwentyeight = new CronJob('0 10 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/100.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 100)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentyeight.start()

// const scoresonehundredtwentynine = new CronJob('0 12 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/147.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 147)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredtwentynine.start()

// const scoresonehundredthirty = new CronJob('0 14 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/110.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 110)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirty.start()

// const scoresonehundredthirtyone = new CronJob('0 16 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/127.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 127)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtyone.start()

// const scoresonehundredthirtytwo = new CronJob('0 18 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/116.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 116)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtytwo.start()

// const scoresonehundredthirtythree = new CronJob('0 20 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/192.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 192)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtythree.start()

// const scoresonehundredthirtyfour = new CronJob('0 22 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/49.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 49)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtyfour.start()

// const scoresonehundredthirtyfive = new CronJob('0 24 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/153.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 153)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtyfive.start()

// const scoresonehundredthirtysix = new CronJob('0 26 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/140.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 140)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtysix.start()

// const scoresonehundredthirtyseven = new CronJob('0 28 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/191.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 191)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtyseven.start()

// const scoresonehundredthirtyeight = new CronJob('0 30 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/70.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 70)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtyeight.start()

// const scoresonehundredthirtynine = new CronJob('0 32 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/162.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 162)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredthirtynine.start()

// const scoresonehundredfourty = new CronJob('0 34 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/61.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 61)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourty.start()

// const scoresonehundredfourtyone = new CronJob('0 36 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/55.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 55)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtyone.start()

// const scoresonehundredfourtytwo = new CronJob('0 38 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/21.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 21)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtytwo.start()

// const scoresonehundredfourtythree = new CronJob('0 40 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/193.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 193)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtythree.start()

// const scoresonehundredfourtyfour = new CronJob('0 42 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/41.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 41)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtyfour.start()

// const scoresonehundredfourtyfive = new CronJob('0 44 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/51.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 51)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtyfive.start()

// const scoresonehundredfourtysix = new CronJob('0 46 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/40.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 40)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtysix.start()

// const scoresonehundredfourtyseven = new CronJob('0 48 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/74.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 74)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtyseven.start()

// const scoresonehundredfourtyeight = new CronJob('0 50 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/118.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 118)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtyeight.start()

// const scoresonehundredfourtynine = new CronJob('0 52 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/160.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 160)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfourtynine.start()

// const scoresonehundredfifty = new CronJob('0 54 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/187.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 187)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfifty.start()

// const scoresonehundredfiftyone = new CronJob('0 56 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/161.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 161)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftyone.start()

// const scoresonehundredfiftytwo = new CronJob('0 58 7 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/99.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 99)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftytwo.start()

// const scoresonehundredfiftythree = new CronJob('0 0 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/177.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 177)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftythree.start()

// const scoresonehundredfiftyfour = new CronJob('0 4 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/111.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 111)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftyfour.start()

// const scoresonehundredfiftyfive = new CronJob('0 6 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/73.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 73)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftyfive.start()

// const scoresonehundredfiftysix = new CronJob('0 8 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/197.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 197)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftysix.start()

// const scoresonehundredfiftyseven = new CronJob('0 10 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/149.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 149)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftyseven.start()

// const scoresonehundredfiftyeight = new CronJob('0 12 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/183.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 183)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftyeight.start()

// const scoresonehundredfiftynine = new CronJob('0 14 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/190.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 190)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredfiftynine.start()

// const scoresonehundredsixty = new CronJob('0 16 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/78.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 78)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixty.start()

// const scoresonehundredsixtyone = new CronJob('0 18 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/138.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 138)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtyone.start()

// const scoresonehundredsixtytwo = new CronJob('0 20 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/139.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 139)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtytwo.start()

// const scoresonehundredsixtythree = new CronJob('0 22 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/159.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 159)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtythree.start()

// const scoresonehundredsixtyfour = new CronJob('0 24 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/53.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 53)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtyfour.start()

// const scoresonehundredsixtyfive = new CronJob('0 26 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/15.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 15)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtyfive.start()

// const scoresonehundredsixtysix = new CronJob('0 28 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/52.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 52)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtysix.start()

// const scoresonehundredsixtyseven = new CronJob('0 30 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/176.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 176)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtyseven.start()

// const scoresonehundredsixtyeight = new CronJob('0 32 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/124.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 124)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtyeight.start()

// const scoresonehundredsixtynine = new CronJob('0 34 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/128.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 128)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredsixtynine.start()

// const scoresonehundredseventy = new CronJob('0 36 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/98.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 98)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventy.start()

// const scoresonehundredseventyone = new CronJob('0 38 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/123.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 123)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventyone.start()

// const scoresonehundredseventytwo = new CronJob('0 40 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/122.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 122)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventytwo.start()

// const scoresonehundredseventythree = new CronJob('0 42 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/133.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 133)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventythree.start()

// const scoresonehundredseventyfour = new CronJob('0 44 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/24.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 24)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventyfour.start()

// const scoresonehundredseventyfive = new CronJob('0 46 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/18.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 18)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventyfive.start()

// const scoresonehundredseventysix = new CronJob('0 48 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/195.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 195)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventysix.start()

// const scoresonehundredseventyseven = new CronJob('0 50 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/86.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 86)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventyseven.start()

// const scoresonehundredseventyeight = new CronJob('0 52 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/194.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 194)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventyeight.start()

// const scoresonehundredseventynine = new CronJob('0 54 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/120.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 120)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredseventynine.start()

// const scoresonehundredeighty = new CronJob('0 56 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/170.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 170)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeighty.start()

// const scoresonehundredeightyone = new CronJob('0 58 8 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/169.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 169)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightyone.start()

// const scoresonehundredeightytwo = new CronJob('0 0 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/13.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 13)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightytwo.start()

// const scoresonehundredeightythree = new CronJob('0 2 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/145.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 145)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightythree.start()

// const scoresonehundredeightyfour = new CronJob('0 4 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/82.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 82)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightyfour.start()

// const scoresonehundredeightyfive = new CronJob('0 6 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/62.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 62)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightyfive.start()

// const scoresonehundredeightysix = new CronJob('0 8 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/46.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 46)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightysix.start()

// const scoresonehundredeightyseven = new CronJob('0 10 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/14.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 14)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightyseven.start()

// const scoresonehundredeightyeight = new CronJob('0 12 9 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const dir = path.resolve(__dirname, '../../backup/courses/180.csv') // ordenar, 
//   const arr = await readFileCsv(dir)
//   const orders = await orderCourseEvaluations(arr)
//   const enrols = await migrationCourseEvaluations(orders, moodleId = 180)
//   // console.log('orders', orders)
// }, null, true, 'America/Bogota')
// scoresonehundredeightyeight.start()

// 0 40 5
const certificate = new CronJob('0 41 5 * * *', async function() {
  console.log('You will see this message every minuto');
  const dir = path.resolve(__dirname, '../../backup/data.json')
  const arr = await readFile(dir)
  const users = await createUserCertificate(arr)
  const grades = await gradesCron(arr)
  const enrols = grades && await enrolCron(grades)
  const certi = enrols && enrols.validEnrols && await certificateCron(enrols.validEnrols)
  const filterArr = arr.filter(element => element.courseid == '89' || element.courseid == '174')
  const emails = enrols && enrols.validEnrols && certi && await createPdfStudent(filterArr)
  console.log('users', users)
  console.log('grades', grades)
  console.log('enrols', enrols)
  enrols && enrols.validEnrols && console.log('certi', certi)
  console.log('emails', emails)
}, null, true, 'America/Bogota');
certificate.start();

const files = new CronJob('0 7 21 * * *', async function() {
  console.log('You will see this message every minuto');
  const files = await portfolioFile('/certificates/free/')
  const filterFiles = files.filter(file => file.includes('.pdf'))
  const dir = path.resolve(__dirname, '../../backup/data.json')
  const arr = await readFile(dir)
  const filterArr = arr.filter(element => element.courseid == '89' || element.courseid == '174')
  console.log('filterFiles', filterFiles)
  console.log('filterArr', filterArr)
  const send = await sendEmailStudent(filterFiles, filterArr)
}, null, true, 'America/Bogota');
files.start();

const deletes = new CronJob('0 1 6 * * *', async function() {
  console.log('You will see this message every minuto');
  const files = await portfolioFile('/certificates/free/')
  const filterFiles = files.filter(file => file.includes('.pdf'))
  const send = await deleteFilesPdf(filterFiles)
}, null, true, 'America/Bogota');
deletes.start();

// const deleteAudios = new CronJob('0 20 6 * * *', async function() {
//   console.log('You will see this message every minuto');
//   const files = await portfolioFile('/audio/')
//   const filterFiles = files.filter(file => file.includes('.mp3'))
//   const send = await deleteFilesAudio(filterFiles)
// }, null, true, 'America/Bogota');
// deleteAudios.start();

const zadarma = new CronJob('0 0 11 * * *', async function() {
  console.log('You will see this message every minuto');
  const usersZadarma = await saveTokenZadarma()
  console.log('usersZadarma', usersZadarma)
}, null, true, 'America/Bogota');
zadarma.start();

const enrol = new CronJob('0 0 19 * * *', async function() {
  console.log('You will see this message every minuto');
  const dir = path.resolve(__dirname, '../../backup/enrol.json')
  const arr = await readFile(dir)
  const enrols = await createEnrolID(arr)
  console.log('enrols', enrols)
}, null, true, 'America/Bogota');
enrol.start();

const address = new CronJob('0 11 6 * * *', async function() {
  console.log('You will see this message every minuto');
  const dir = path.resolve(__dirname, '../../backup/data.json')
  const arr = await readFile(dir)
  const enrols = await createAddressEnrol(arr)
  console.log('enrols', enrols)
}, null, true, 'America/Bogota');
address.start();

const examinmodulesone = new CronJob('0 0 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(0, count)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesone.start()

const examinmodulestwo = new CronJob('0 12 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count, count*2)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulestwo.start()

const examinmodulesthree = new CronJob('0 24 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count*2, count*3)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesthree.start()

const examinmodulesfour = new CronJob('0 36 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count*3, count*4)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesfour.start()

const examinmodulesfive = new CronJob('0 48 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count*4, coursesCount)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesfive.start()

const zadarmaGoogle = new CronJob('0 0 20 * * *', async function() {
  console.log('You will see this message every minuto')
  const calls = await listCallsGoogle()
  const uploads = await uploadCallAudio(calls)
}, null, true, 'America/Bogota')
zadarmaGoogle.start()

module.exports = {
  job,
  enrol,
  zadarma,
  certificate,
  address,
  files
}

//0 0 * * 0 /usr/bin/mysqldump -u root --databases manvicio_ertmdl > /var/backups/moodle/moodle-"$(date +"%m-%d-%Y %H-%M")".sql
//16 25 4 3 *  /usr/bin/mysql -u root --databases manvicio_ertmdl
// 1 * * * * /usr/bin/php7.4  /var/www/moodle/admin/cli/cron.php
//* * * * * /usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT json_arrayagg(json_object('id', u.id, 'username', u.username, 'firstname', u.firstname, 'lastname', u.lastname, 'email', u.email, 'country', u.country, 'city', u.city, 'courseid', c.id, 'date', IF(cc.timecompleted=0,'',DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%e/%c/%Y')), 'completed', IF((cc.timecompleted=0 OR cc.timecompleted IS NULL), IF(cc.timestarted=0,'Not started','Not complete'), 'Complete'))) AS 'json' FROM (mdl_user AS u INNER JOIN (mdl_course AS c INNER JOIN mdl_course_completions AS cc ON c.ID = cc.course) ON u.ID = cc.userid) INNER JOIN mdl_course_categories AS ccat ON ccat.id = c.category  WHERE cc.timecompleted != 0  AND cc.timecompleted IS NOT NULL AND DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%e/%c/%Y')='2/4/2021'" > /var/backups/moodle/data.json
//* * * * * /usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT json_arrayagg(json_object('id', id)) from mdl_course" > /var/backups/moodle/course.json
//* * * * * /usr/local/bin/consult.sh 