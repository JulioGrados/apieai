'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')
const CustomError = require('custom-error-instance')
const { generateHash } = require('utils/functions/auth')
const { searchUsername, searchEmail, searchID, searchUser } = require('utils/functions/moodle')

const courseFunc = require('utils/functions/course')
const { payloadToData } = require('utils/functions/user')
const { getBase64 } = require('utils/functions/base64')
const { createTimeline } = require('./timeline')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const { MEDIA_PATH } = require('utils/files/path')
const { createEmail } = require('./email')
const { getSocket } = require('../lib/io')
const { createNewUserMoodle } = require('../functions/createNewUserMoodle')
const { createEnrolUserMoodle } = require('./enrol')
const { templateCertificate } = require('utils/emails/certificate')
const { studentsEnrolAgreement } = require('../functions/enrolAgreement')
let randomize = require('randomatic')
const { templateAccess } = require('utils/emails/access')
const { templateAccessClient } = require('utils/emails/accessClient')
const currenciesData = require('utils/functions/currencies')

const { receiptDB, enrolDB } = require('db/lib')
const { dealDB, userDB, progressDB, callDB, emailDB, saleDB, timelineDB, whastsappDB } = require('../db')



const listDeals = async params => {
  console.log('--------------------------------------------------------')
  console.log('DEALS')
  console.log('--------------------------------------------------------')
  const deals = await dealDB.list(params)
  return deals
}

const searchDeals = async params => {
  const deals = await dealDB.search(params)
  return deals
}

const dashDeals = async params => {
  console.log('params', params)
  const deals = await dealDB.dash(params)
  return deals
}

const generalDeals = async params => {
  const deals = await dealDB.general(params)
  return deals
}

const assessorDeals = async params => {
  console.log('--------------------------------------------------------')
  console.log('DEALS ASSESSOR')
  console.log('--------------------------------------------------------')
  const deals = await dealDB.assessor(params)
  return deals
}

const createDeal = async (body, loggedUser) => {
  if (body.status === 'Abierto') {
    const existDeal = await findDealUser(body.client)
    if (existDeal) {
      const InvalidError = CustomError('InvalidError', { message: 'Ya existe un trato abierto para el cliente.', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  } else if (body.status === 'Perdido') {
    body.isClosed = true
    body.endDate = Date()
  } else if (body.status === 'Ganado') {
    if (!body.client.moodleId) {
      const InvalidError = CustomError('InvalidError', { message: 'El usuario debe ser cliente en moodle', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  }
  const deal = await dealDB.create(body)

  if (deal.status === 'Ganado') {
    await addCoursesMoodle(deal, body.client, loggedUser)
  }

  return deal
}

const mixDeal = async (body, loggedUser) => {
  try {
    const dealP = await dealDB.detail({ query: { _id: body.primary } })
    const dealS = await dealDB.detail({ query: { _id: body.secundary } })
    // console.log('dealP', dealP)
    // console.log('dealS', dealS)
    if (dealP.client && dealS.client) {
      const userP = await userDB.detail({ query: { _id: dealP.client } })
      const userS = await userDB.detail({ query: { _id: dealS.client } })
      // console.log('userP', userP)
      // console.log('userS', userS)
      if (!userP.names && userS.names) {
        userP.names = userS.names
      }

      if (!userP.email && userS.email) {
        userP.email = userS.email
      }

      if (!userP.mobile && userS.mobile) {
        userP.mobile = userS.mobile
      }

      if (!userP.mobileCode && userS.mobileCode) {
        userP.mobileCode = userS.mobileCode
      }

      if (!userP.firstName && userS.firstName) {
        userP.firstName = userS.firstName
      }

      if (!userP.lastName && userS.lastName) {
        userP.lastName = userS.lastName
      }

      if (!userP.dni && userS.dni) {
        userP.dni = userS.dni
      }

      if (!userP.country && userS.country) {
        userP.country = userS.country
      }

      if (userP.extras) {
        if (userS.mobile && userS.mobile !== userP.mobile) {
          userP.extras.push({
            type: 'mobile',
            value: userS.mobile,
            code: userS.mobileCode,
            use: 'Otro'
          })
        }

        if (userS.email && userS.email !== userP.email) {
          userP.extras.push({
            type: 'email',
            value: userS.email,
            use: 'Otro'
          })
        }
      } else {
        userP.extras = []
        if (userS.mobile && userS.mobile !== userP.mobile) {
          userP.extras.push({
            type: 'mobile',
            value: userS.mobile,
            code: userS.mobileCode,
            use: 'Otro'
          })
        }

        if (userS.email && userS.email !== userP.email) {
          userP.extras.push({
            type: 'email',
            value: userS.email,
            use: 'Otro'
          })
        }
      }

      const calls = await callDB.list({ query: { deal: dealS._id } }) 
      const emails = await emailDB.list({ query: { deal: dealS._id } }) 
      const sales = await saleDB.list({ query: { deal: dealS._id } }) 
      const timelines = await timelineDB.list({ query: { deal: dealS._id } }) 
      const whatsapps = await whastsappDB.list({ query: { deal: dealS._id } })
      const receipts = await receiptDB.list({ query: { deal: dealS._id } })
      
      const resultCalls = await Promise.all(
        calls.map(async call => {
          const callRes = await callDB.update(call._id, {
            deal: dealP._id
          })
          return callRes
        })
      )

      const resultEmails = await Promise.all(
        emails.map(async email => {
          const emailRes = await emailDB.update(email._id, {
            deal: dealP._id
          })
          return emailRes
        })
      )

      const resultSales = await Promise.all(
        sales.map(async sale => {
          const saleRes = await saleDB.update(sale._id, {
            deal: dealP._id
          })
          return saleRes
        })
      )

      const resultTimeline = await Promise.all(
        timelines.map(async timeline => {
          const timelineRes = await timelineDB.update(timeline._id, {
            deal: dealP._id
          })
          return timelineRes
        })
      )

      const resultWhastsapp = await Promise.all(
        whatsapps.map(async whastsapp => {
          const whastsappRes = await whastsappDB.update(whastsapp._id, {
            deal: dealP._id
          })
          return whastsappRes
        })
      )

      const resultReceipts = await Promise.all(
        receipts.map(async receipt => {
          const receiptRes = await receiptDB.update(receipt._id, {
            deal: dealP._id
          })
          return receiptRes
        })
      )

      await userDB.remove(userS._id)
      await userDB.update(userP._id, {
        ...userP.toJSON()
      })
      await dealDB.remove(dealS._id)
      const dealUpdate = await dealDB.detail({query : {_id: dealP._id}, populate: ['client']})
      return dealUpdate
    } else {
      const InvalidError = CustomError('InvalidError', { message: 'Uno de los dos tratos no tiene cliente', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  } catch (error) {
    throw error
  }
}

const updateDealOne = async (dealId, body, loggedUser) => {
  const updateDeal = await dealDB.updateOne(dealId, body)
  return updateDeal
}

const updateDeal = async (dealId, body, loggedUser) => {
  // console.log('dealId', dealId)
  console.log('body', body)
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  // console.log('deal', deal)
  const enrolAgreement = await studentsEnrolAgreement(deal.students)
  console.log('enrolAgreement', enrolAgreement)
  const dataDeal = await changeStatus(body, deal, loggedUser, body)
  // console.log('dataDeal', dataDeal)
  const updateDeal = await dealDB.update(dealId, dataDeal)
  // console.log('updateDeal', updateDeal)
  timelineProgress(updateDeal.toJSON(), deal.toJSON(), loggedUser)
  return updateDeal
}

const changeDeal = async (body, loggedUser) => {
  try {
    const deal = await dealDB.detail({ query: { _id: body.deal } })
    const user = await userDB.detail({ query: { _id: body.user } })
    let students = deal.students
    students[0].student = {
      ...user.toJSON(),
      ref: user
    }
    const updateDeal = await dealDB.update(deal._id, {
      client: user._id,
      students: students
    })
    console.log('updateDeal', updateDeal)
    return updateDeal
  } catch (error) {
    throw error
  }
}

const updateDealCreate = async (dealId, body, loggedUser) => {
  // console.log('dealId', dealId)
  // console.log('body', body)
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  
  const dataDeal = await changeStatus(body, deal, loggedUser, body)
  // console.log('dataDeal', dataDeal)
  const updateDeal = await dealDB.update(dealId, dataDeal)
  // console.log('updateDeal', updateDeal)
  timelineProgress(updateDeal.toJSON(), deal.toJSON(), loggedUser)
  return deal
}

const updateWinner = async (dealId, body, loggedUser) => {
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })

  const progress = await progressDB.detail({ query: { key: 'won' } })
  let progressPayment
  if (progress) {
    progressPayment = {
      name: progress.name,
      ref: progress._id
    }
  }

  if (deal.client && deal.client._id) {
    const user = await userDB.detail({ query: { _id: deal.client._id } })
    await userDB.update(user._id, {
      roles: [...user.roles, 'Cliente']
    })
  }
  const statusActivity = 'done'
  const status = 'Ganado'
  const statusPayment = 'Abierto'
  const updateDeal = await dealDB.update(deal._id, {
    progressPayment,
    statusActivity,
    status,
    statusPayment
  })

  await createTimeline({
    linked: updateDeal.client,
    deal: updateDeal,
    assigned: updateDeal.assessor,
    type: 'Deal',
    name: `[Trato Ganado]`
  })
  const treasurer = await userDB.detail({query: { roles: 'Tesorero' }})
  emitDeal(updateDeal)
  emitAccounting(updateDeal, treasurer)
  return updateDeal
}

const detailDeal = async params => {
  const deal = await dealDB.detail(params)
  return deal
}

const deleteDeal = async dealId => {
  const deal = await dealDB.remove(dealId)
  return deal
}

const countDocuments = async params => {
  const count = await dealDB.count(params)
  return count
}

const createOrUpdateDeal = async (user, body, lead = {}, update = false) => {
  const deal = await findDealUser(user)
  // console.log('deal', deal)
  // console.log('body', body)
  if (deal) {
    if (deal.status === 'Abierto') {
      const updateDeal = await editExistDeal(deal.toJSON(), user, body)
      return updateDeal
    } else if (deal.status === 'Perdido') {
      const updateDeal = await editExistDealAgain(deal.toJSON(), user, body)
      update && (createTimeline({
        linked: user,
        assigned: updateDeal.assessor,
        deal: updateDeal,
        type: 'Deal',
        name: `Actualizado: [Nombres]: ${lead.names ? lead.names : ''} - [Email]: ${lead.email ? lead.email : ''} - [Celular]: ${lead.mobile ? lead.mobile : ''} - [País]: ${lead.country ? lead.country : ''} - [Ciudad]: ${lead.city ? lead.city : ''}`
      }))
      return updateDeal
    } else if (deal.status === 'Ganado') {
      if (deal.statusPayment === 'Abierto') {
        console.log('aun no pago todo')
      } else if (deal.statusPayment === 'Pago') {
        const updateDeal = await editExistDealAgain(deal.toJSON(), user, body)
        lead && (createTimeline({
          linked: user,
          assigned: updateDeal.assessor,
          deal: updateDeal,
          type: 'Deal',
          name: `Actualizado: [Nombres]: ${lead.names ? lead.names : ''} - [Email]: ${lead.email ? lead.email : ''} - [Celular]: ${lead.mobile ? lead.mobile : ''} - [País]: ${lead.country ? lead.country : ''} - [Ciudad]: ${lead.city ? lead.city : ''}`
        }))
        return updateDeal
      }
    }
  } else {
    const deal = await createNewDeal(user, body)
    createTimeline({ linked: user, deal:deal, type: 'Deal', name: 'Nuevo trato creado' })
    return deal
  }
}

const addOrUpdateUserDeal = async (user, body, lead = {}, update = false) => {
  const deal = await findDealUser(user)
  // console.log('deal', deal)
  // console.log('body', body)
  if (deal) {
    if (deal.status === 'Abierto') {
      try {
        const updateDeal = await editExistDealOpenCrm(deal.toJSON(), user, body)
        return updateDeal
      } catch (error) {
        throw error  
      }
      
    } else if (deal.status === 'Perdido') {
      const updateDeal = await editExistDealCrm(deal.toJSON(), user, body)
      update && (createTimeline({
        linked: user,
        assigned: updateDeal.assessor,
        deal: updateDeal,
        type: 'Deal',
        name: `Actualizado: [Nombres]: ${lead.names ? lead.names : ''} - [Email]: ${lead.email ? lead.email : ''} - [Celular]: ${lead.mobile ? lead.mobile : ''} - [País]: ${lead.country ? lead.country : ''} - [Ciudad]: ${lead.city ? lead.city : ''}`
      }))
      return updateDeal
    } else if (deal.status === 'Ganado') {
      if (deal.statusPayment === 'Abierto') {
        const InvalidError = CustomError('InvalidError', { message: 'El trato está asignado al área de tesorería. Contactar a tu supervisor para mayor información.', code: 'EINVLD', deal: { ...deal.toJSON() } }, CustomError.factory.expectReceive);
        throw new InvalidError()
      } else if (deal.statusPayment === 'Pago') {
        const updateDeal = await editExistDealCrm(deal.toJSON(), user, body)
        lead && (createTimeline({
          linked: user,
          assigned: updateDeal.assessor,
          deal: updateDeal,
          type: 'Deal',
          name: `Actualizado: [Nombres]: ${lead.names ? lead.names : ''} - [Email]: ${lead.email ? lead.email : ''} - [Celular]: ${lead.mobile ? lead.mobile : ''} - [País]: ${lead.country ? lead.country : ''} - [Ciudad]: ${lead.city ? lead.city : ''}`
        }))
        return updateDeal
      }
    }
  } else {
    const deal = await createNewDealOnly(user, body)
    createTimeline({ linked: user, deal:deal, type: 'Deal', name: 'Nuevo trato creado' })
    return deal
  }
}

const createDealUserOnly = async (user, body, lead = {}, update = false) => {
  const deal = await findDealUser(user)
  console.log('deal create', deal)
  if (deal) {
    if (deal.status === 'Abierto') {
      // error ya existe
      console.log('1')
      const InvalidError = CustomError('InvalidError', { message: 'Ya existe un trato abierto para el cliente.', code: 'EINVLD', deal: { ...deal.toJSON() } }, CustomError.factory.expectReceive);
      throw new InvalidError()
    } else if (deal.status === 'Perdido') {
      // actualizar
      console.log('2')
      const updateDeal = await editExistDealAgain(deal.toJSON(), user, body)
      update && (
      createTimeline({
        linked: user,
        assigned: updateDeal.assessor,
        deal: updateDeal,
        type: 'Deal',
        name: `Actualizado: [Nombres]: ${lead.names ? lead.names : ''} - [Email]: ${lead.email ? lead.email : ''} - [Celular]: ${lead.mobile ? lead.mobile : ''} - [País]: ${lead.country ? lead.country : ''} - [Ciudad]: ${lead.city ? lead.city : ''}`
      }))
      return updateDeal
    } else if (deal.status === 'Ganado') {
      if (deal.statusPayment === 'Abierto') {
        console.log('3')
        const InvalidError = CustomError('InvalidError', { message: 'Ya existe un trato abierto para el cliente.', code: 'EINVLD', deal: { ...deal.toJSON() } }, CustomError.factory.expectReceive);
        throw new InvalidError()
      } else if(deal.statusPayment === 'Pago') {
        // actualizar
        console.log('4')
        const updateDeal = await editExistDealOnly(deal.toJSON(), user, body)
        update && (
        createTimeline({
          linked: user,
          assigned: updateDeal.assessor,
          deal: updateDeal,
          type: 'Deal',
          name: `Actualizado: [Nombres]: ${lead.names ? lead.names : ''} - [Email]: ${lead.email ? lead.email : ''} - [Celular]: ${lead.mobile ? lead.mobile : ''} - [País]: ${lead.country ? lead.country : ''} - [Ciudad]: ${lead.city ? lead.city : ''}`
        }))
        return updateDeal
      }
    }
  } else {
    const deal = await createNewDealOnly(user, body)
    createTimeline({ linked: user, deal:deal, type: 'Deal', name: 'Nuevo trato creado' })
    return deal
  }
}

const findDealUser = async user => {
  // agregar el estado de pago de contabilidad 
  try {
    const deal = await dealDB.detail({
      query: {
        client: user._id || user,
        // status: 'Abierto'
      },
      populate: {
        path: 'assessor.ref'
      }
    })
    return deal
  } catch (error) {
    return null
  }
}

const createNewDeal = async (user, body) => {
  console.log('createNewDeal')
  const dataDeal = await addInitialStatus(body)
  // if (body.assessor && body.assessor.username) {
  //   dataDeal.assessor.username = body.assessor.username
  //   dataDeal.assessor.ref = await assignedAssessorOne(body.assessor.username)
  // } else {
  //   dataDeal.assessor = await assignedPosition()
  // }
  const assessor = await assignedPosition()
  const assessorAssigned = {
    username: assessor.username,
    ref: assessor
  }
  dataDeal.assessor = assessorAssigned

  // console.log('dataDeal', dataDeal)

  const deal = await dealDB.create({
    ...dataDeal,
    client: user,
    money: castMoneyDeal(body.currency),
    students: [
      {
        student: {...user, ref: user},
        courses: castCoursePrice(body.courses, body.currency)
      }
    ]
  })
  
  await addCall(user, deal, body.courses)
  await prepareCourses(user, deal.toJSON(), [], body.courses, body.source)
  await incProspects(dataDeal)
  emitDeal(deal)
  return deal
}

const castCoursePrice = (courses, currency = 'PEN') => {
  // console.log('courses', courses)
  const converts = courses.map(course => {
    console.log('course', course)
    console.log('coins', course.coins)
    console.log('currency', currency)
    const price = course && course.coins && course.coins.find(item => item.code === currency)
    return {
      ...course,
      price: price.price
    }
  })
  return converts
}

const castMoneyDeal = (currency = 'PEN') => {
  return currenciesData.find(item => item.code === currency)
}

const createNewDealOnly = async (user, body) => {
  const dataDeal = await addInitialStatus(body)
  if (body.assessor && body.assessor.username) {
    dataDeal.assessor.username = body.assessor.username
    dataDeal.assessor.ref = await assignedAssessorOne(body.assessor.username)
  } else {
    dataDeal.assessor = await assignedAssessor(body.courses)
  }
  // console.log('user', {...user})
  const deal = await dealDB.create({
    ...dataDeal,
    statusActivity: 'done',
    client: user,
    money: castMoneyDeal(body.currency),
    students: [
      {
        student: {...user, ref: user},
        courses: castCoursePrice(body.courses, body.currency)
      }
    ]
  })
  
  // await addCall(user, deal, body.courses)
  // await prepareCourses(user, deal.toJSON(), [], body.courses, body.source)
  await incProspects(dataDeal)
  emitDeal(deal)
  return deal
}

const editExistDealOnly = async (deal, user, body) => {
  let dataDeal = await addInitialStatusAgain(deal)
  if (body.assessor && body.assessor.username) {
    dataDeal.assessor.username = body.assessor.username
    dataDeal.assessor.ref = await assignedAssessorOne(body.assessor.username)
  } else {
    dataDeal.assessor = await assignedAssessor(body.courses)
  }
  
  // console.log('deal prepare', deal.students)
  // console.log('body.courses', body.courses)
  // console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  dataDeal.students = []
  
  dataDeal = {
    ...dataDeal,
    client: user,
    money: castMoneyDeal(body.currency),
    students: [
      {
        student: {...user, ref: user},
        courses: prepareCoursesOnly(user, dataDeal, [], castCoursePrice(body.courses, body.currency), body.source)
      }
    ]
  }

  const updateDeal = await dealDB.update(deal._id, {
    ...dataDeal
  })
  console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  console.log('dataDeal.students[0].student', dataDeal.students[0].student && dataDeal.students[0].student)
  console.log('updateDeal', updateDeal)
  incProspects(dataDeal)
  emitDeal(updateDeal)
  return updateDeal
}

const editExistDealAgain = async (deal, user, body) => {
  let dataDeal = await addInitialStatusAgain(deal)
  // if (!dataDeal.assessor) {
  //   dataDeal.assessor = await assignedAssessor(body.courses)
  //   incProspects(dataDeal)
  // }
  const assessor = await assignedPosition()
  const assessorAssigned = {
    username: assessor.username,
    ref: assessor
  }
  dataDeal.assessor = assessorAssigned
  await incProspects(dataDeal)
  console.log('dataDeal', dataDeal)
  
  // console.log('deal prepare', deal.students)
  // console.log('body.courses', body.courses)
  // console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  dataDeal.students = []
  
  dataDeal = {
    ...dataDeal,
    client: user,
    money: castMoneyDeal(body.currency),
    students: [
      {
        student: {...user, ref: user},
        courses: prepareCourses(user, dataDeal, [], castCoursePrice(body.courses, body.currency), body.source)
      }
    ]
  }

  const updateDeal = await dealDB.update(deal._id, {
    ...dataDeal
  })
  console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  console.log('dataDeal.students[0].student', dataDeal.students[0].student && dataDeal.students[0].student)
  console.log('updateDeal', updateDeal )
  emitDeal(updateDeal)
  addCall(user, updateDeal)
  return updateDeal
}

const editExistDeal = async (deal, user, body) => {
  const dataDeal = await addInitialStatusAgain(deal)
  // console.log('dataDeal', dataDeal)
  if (!dataDeal.assessor) {
    const assessor = await assignedPosition()
    const assessorAssigned = {
      username: assessor.username,
      ref: assessor
    }
    dataDeal.assessor = assessorAssigned
  } else {
    if (dataDeal.assessor && dataDeal.assessor.ref && dataDeal.assessor.ref.status === false) {
      const assessor = await assignedPosition()
      const assessorAssigned = {
        username: assessor.username,
        ref: assessor
      }
      dataDeal.assessor = assessorAssigned
    }
  }
  
  dataDeal.students[0]
    ? dataDeal.students[0].courses = prepareCourses(
        user,
        dataDeal,
        dataDeal.students[0].courses,
        castCoursePrice(body.courses, body.currency),
        body.source
      )
    : {
        ...dataDeal,
        client: user,
        students: [
          {
            student: {...user, ref: user},
            courses: prepareCourses(user, dataDeal, [], castCoursePrice(body.courses, body.currency), body.source)
          }
        ]
    }
  
  const infoDeal = {
    ...dataDeal,
    money: castMoneyDeal(body.currency)
  }
  const updateDeal = await dealDB.update(deal._id, {
    ...infoDeal
  })
  console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  emitDeal(updateDeal)
  addCall(user, updateDeal)
  return updateDeal
}

const createNewDealCrm = async (user, body) => {
  console.log('createNewDealCrm')
  const dataDeal = await addInitialStatus(body)
  const userAssessor = await userDB.detail({ query: { roles: 'Asesor', username: body.assessor.username } })
  if (userAssessor.status) {
    const assessorAssigned = {
      username: body.assessor.username,
      ref: body.assessor.ref
    }
    dataDeal.assessor = assessorAssigned
  } else {
    const assessor = await assignedPosition()
    const assessorAssigned = {
      username: assessor.username,
      ref: assessor
    }
    dataDeal.assessor = assessorAssigned
  }

  // console.log('dataDeal', dataDeal)

  const deal = await dealDB.create({
    ...dataDeal,
    client: user,
    money: castMoneyDeal(body.currency),
    students: [
      {
        student: {...user, ref: user},
        courses: castCoursePrice(body.courses, body.currency)
      }
    ]
  })
  
  await addCall(user, deal, body.courses)
  await prepareCourses(user, deal.toJSON(), [], body.courses, body.source)
  await incProspects(dataDeal)
  emitDeal(deal)
  return deal
}

const editExistDealCrm = async (deal, user, body) => {
  const dataDeal = await addInitialStatusAgain(deal)
  console.log('dataDeal', dataDeal)
  console.log('user', user)
  console.log('body', body)
  const userAssessor = await userDB.detail({ query: { roles: 'Asesor', username: body.assessor.username } })
  if (userAssessor.status) {
    const assessorAssigned = {
      username: body.assessor.username,
      ref: body.assessor.ref
    }
    dataDeal.assessor = assessorAssigned
  } else {
    const assessor = await assignedPosition()
    const assessorAssigned = {
      username: assessor.username,
      ref: assessor
    }
    dataDeal.assessor = assessorAssigned
  }
  
  dataDeal.students[0]
    ? dataDeal.students[0].courses = prepareCoursesOnly(
        user,
        dataDeal,
        dataDeal.students[0].courses,
        castCoursePrice(body.courses, body.currency),
        body.source
      )
    : {
        ...dataDeal,
        client: user,
        students: [
          {
            student: {...user, ref: user},
            courses: prepareCoursesOnly(user, dataDeal, [], castCoursePrice(body.courses, body.currency), body.source)
          }
        ]
    }
  
  const infoDeal = {
    ...dataDeal,
    money: castMoneyDeal(body.currency)
  }
  const updateDeal = await dealDB.update(deal._id, {
    ...infoDeal
  })
  console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  emitDeal(updateDeal)
  addCall(user, updateDeal)
  return updateDeal
}

const editExistDealOpenCrm = async (deal, user, body) => {
  const dataDeal = await addInitialStatusAgain(deal)
  console.log('dataDeal', dataDeal)
  console.log('user', user)
  console.log('body', body)
  const userAssessorDeal = await userDB.detail({ query: { roles: 'Asesor', username: dataDeal.assessor.username } })
  const userAssessorBody = await userDB.detail({ query: { roles: 'Asesor', username: body.assessor.username } })
  if (userAssessorDeal.status) {
    const InvalidError = CustomError('CastError', { message: 'Este trato esta actualmente asignado a otra asesora.', code: 'EINVLD' }, CustomError.factory.expectReceive)
    throw new InvalidError()
  } else {
    if (userAssessorBody.status) {
      const assessorAssigned = {
        username: body.assessor.username,
        ref: body.assessor.ref
      }
      dataDeal.assessor = assessorAssigned
    } else {
      const assessor = await assignedPosition()
      const assessorAssigned = {
        username: assessor.username,
        ref: assessor
      }
      dataDeal.assessor = assessorAssigned
    }
  }
  
  dataDeal.students[0]
    ? dataDeal.students[0].courses = prepareCoursesOnly(
        user,
        dataDeal,
        dataDeal.students[0].courses,
        castCoursePrice(body.courses, body.currency),
        body.source
      )
    : {
        ...dataDeal,
        client: user,
        students: [
          {
            student: {...user, ref: user},
            courses: prepareCoursesOnly(user, dataDeal, [], castCoursePrice(body.courses, body.currency), body.source)
          }
        ]
    }
  
  const infoDeal = {
    ...dataDeal,
    money: castMoneyDeal(body.currency)
  }
  const updateDeal = await dealDB.update(deal._id, {
    ...infoDeal
  })
  console.log('dataDeal.students[0].courses', dataDeal.students[0].courses && dataDeal.students[0].courses)
  emitDeal(updateDeal)
  addCall(user, updateDeal)
  return updateDeal
}

const addInitialStatus = async deal => {
  if (!deal.progress) {
    deal.progress = await changeStatusProgress('initial', deal)
  }
  deal.isClosed = false
  deal.statusActivity = 'todo'
  deal.status = 'Abierto'
  deal.statusPayment = 'Sale'
  // agregar el estado de contabilidad nuevo
  return deal
}

const addInitialStatusAgain = async deal => {
  deal.progress = await changeStatusProgress('initial', deal)
  deal.isClosed = false
  deal.statusActivity = 'todo'
  deal.status = 'Abierto'
  deal.statusPayment = 'Sale'
  // agregar el estado de contabilidad nuevo
  return deal
}

const changeStatusProgress = async (key, data) => {
  try {
    const progressItem = await progressDB.detail({ query: { key } })
    const progress = {
      name: progressItem.name,
      ref: progressItem._id
    }
    return progress
  } catch (error) {
    if (error.status !== 404) {
      throw error
    }
    return data.progress
  }
}

const assignedPosition = async () => {
  
  const assessors = await userDB.list({
    query: {
      roles: 'Asesor'
    },
    sort: 'createdAt'
  })
  // console.log('assessors', assessors)
  const {position, initial} = getPosition(assessors)
  const userPosition = assessors[position]
  const userInitial = assessors[initial]
  // console.log('assessors[initial]', assessors[initial])
  // console.log('position', position)
  // console.log('initial', initial)

  // console.log('userPosition', userPosition)
  // console.log('userInitial', userInitial)

  const updateInitial = await userDB.update(userInitial._id, {position: false})
  const updatePosition = await userDB.update(userPosition._id, { position: true })
  
  // console.log('updateInitial', updateInitial)
  // console.log('updatePosition', updatePosition)

  return updatePosition
}

const getPosition = (assessors) => {
  const size = assessors.length - 1
  let initial = assessors.findIndex(x => x.position === true);
  let active = initial
  let found = false
  let position

  do {
    let next = active + 1;
    if (assessors[next] && assessors[next].status === true) {
      found = true
      position = next
    } else {
      if ( size === next || next > size ) {
        active = -1
      } else if (initial === next) {
        found = true
        position = initial
      } else {
        active = active + 1
      }
    }
  } while (found === false)

  return {position, initial}
}

const assignedAssessor = async courses => {
  const coursesId = courses.map(course => course._id)
  const assessors = await userDB.list({
    query: {
      roles: 'Asesor',
      sellCourses: {
        $elemMatch: {
          ref: { $in: coursesId }
        }
      }
    }
  })

  const assessorCourse = getMinAssessor(assessors)

  if (assessorCourse) {
    return assessorCourse
  }

  const allAssessors = await userDB.list({
    query: { roles: 'Asesor' },
    select: { username: 1, prospects: 1 }
  })

  const assessor = getMinAssessor(allAssessors)

  if (assessor) {
    return assessor
  } else {
    const error = {
      status: 500,
      message: 'No se encontro un asesor disponible'
    }
    throw error
  }
}

const assignedAssessorOne = async username => {
  const assessor = await userDB.detail({
    query: {
      roles: 'Asesor',
      username: username
    }
  })

  if (assessor) {
    return assessor
  } else {
    const error = {
      status: 500,
      message: 'No se encontro un asesor disponible'
    }
    throw error
  }
}

const getMinAssessor = assessors => {
  const min = _.minBy(assessors, 'prospects')

  if (min) {
    const assessor = {
      username: min.username,
      ref: min
    }

    return assessor
  } else {
    return null
  }
}

const addCall = async (client, deal) => {
  //const coursesName = courses.map(course => course.name).join(', ')
  const call = await callDB.detail({
    query: { deal: deal._id, isCompleted: false }
  })
  if (call) {
    return
  }
  const lastCall = await callDB.list({
    query: { deal: deal._id },
    sort: '-createdAt'
  })
  console.log('lst Call', lastCall)
  const number = lastCall ? lastCall.length + 1 : 1
  const dataCall = {
    name: `Llamada ${number}`,
    number,
    hour: moment()
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(),
    assigned: deal.assessor,
    linked: {
      names: client.names,
      ref: client._id
    },
    deal: deal._id
  }
  try {
    const newCall = await callDB.create(dataCall)
    emitCall(newCall)
  } catch (error) {
    console.log('error save call', dataCall, error)
  }
}

const emitCall = call => {
  try {
    const io = getSocket()
    io.to(call.assigned.ref).emit('call', call)
  } catch (error) {
    console.log('error sockets', call, error)
  }
}

const emitDeal = deal => {
  try {
    const io = getSocket()
    const assessor = deal.assessor.ref._id
      ? deal.assessor.ref._id
      : deal.assessor.ref
    
    console.log('deal emit', deal.assessor)
    io.to(assessor).emit('deal', deal)
  } catch (error) {
    console.log('error sockets', deal, error)
  }
}

const emitAccounting = (deal, treasurer) => {
  try {
    const io = getSocket()
    console.log('accounting emit', treasurer)
    io.to(treasurer._id).emit('accounting', deal)
  } catch (error) {
    console.log('error sockets', deal, error)
  }
}

const prepareCoursesOnly = (lead, deal, oldCourses, newCourses, source = 'Sitio web') => {
  // console.log('oldCourses', oldCourses)
  // console.log('newCourses', newCourses)
  const courses = oldCourses.filter(course => {
    const index = newCourses.findIndex(item => {
      // console.log('item._id.toString()', item._id.toString())
      // console.log('course._id.toString()', course._id.toString())
      return item.ref && item.ref.toString() === course.ref && course.ref.toString() || item._id && item._id.toString() === course._id && course._id.toString()
    })
    return index === -1
  })
  return [...newCourses, ...courses]
}

const prepareCourses = (lead, deal, oldCourses, newCourses, source = 'Sitio web') => {
  // console.log('oldCourses', oldCourses)
  // console.log('newCourses', newCourses)
  const courses = oldCourses.filter(course => {
    const index = newCourses.findIndex(item => {
      // console.log('item._id.toString()', item._id.toString())
      // console.log('course._id.toString()', course._id.toString())
      return item.ref && item.ref.toString() === course.ref && course.ref.toString() || item._id && item._id.toString() === course._id && course._id.toString()
    })
    return index === -1
  })
  newCourses.forEach(course => {
    // console.log('course', course)
    setTimeout(() => {
      // console.log('prepare lead', deal.assessor)
      createTimeline({
        linked: lead,
        assigned: deal.assessor,
        deal: deal,
        type: 'Curso',
        name: `Solicito información del ${course.name} por ${source}`
      })
      sendEmailCourse(lead, deal, course, true)
    }, 2000)
  })
  return [...newCourses, ...courses]
}


const sendEmailCourse = async (lead, deal, dataCourse, social = false) => {
  const linked = payloadToData(lead)
  const assigned = deal.assessor
  const course = social ? dataCourse : courseFunc.payloadToData(dataCourse)
  const to = linked.email
  const from = 'cursos@eai.edu.pe'
  const fromname = 'Escuela Americana de Innovación'
  const templateId = 'd-fe5148580749466aa59f69e5eab99c9a'
  const preheader = `Información del curso ${course.name}`
  const content =
    'Se envio informacion del curso de la plantilla pre definida en sengrid.'
  const attachment = await getBase64(MEDIA_PATH + course.brochure)
  const attachment1 = await getBase64('https://media.eai.edu.pe/brochure/cursos.pdf')
  const filename = course && 'Brochure - ' + course.name + '.pdf'

  const substitutions = getSubstitutions({
    course,
    linked,
    assigned
  })
  try {
    const email = await createEmail({
      linked,
      to,
      subject: `Certifícate en ${course.shortName}`,
      assigned,
      from,
      fromname,
      preheader,
      content: templateCertificate(substitutions),
      attachments: [
        {
          filename: filename,
          url: MEDIA_PATH + course.brochure
        },
        {
          filename: 'Catálogo de cursos.pdf',
          url: 'https://media.eai.edu.pe/brochure/cursos.pdf'
        }
      ],
      filename,
      deal: deal._id
    })
    console.log('email', email)
    sendMailTemplate({
      to,
      from,
      fromname,
      attachment,
      attachment1,
      filename,
      substitutions,
      templateId: templateId,
      args: {
        emailId: email._id
      }
    })
  } catch (error) {
    console.log('error create email', error)
  }
}

const getStart = ( start = new Date() ) => {
  const day = new Date().getDay()
  let sum1 = 0; let sum2 = 0; let sum3 = 0
  if (day >= 0 && day < 4) {
    sum1 = 1
    sum2 = 2
    sum3 = 3
  } else if (day === 4) {
    sum1 = 1
    sum2 = 2
    sum3 = 4
  } else if (day === 5) {
    sum1 = 1
    sum2 = 3
    sum3 = 4
  } else if (day === 6) {
    sum1 = 2
    sum2 = 3
    sum3 = 4
  }
  const day1 = moment(start).add(sum1, 'days').format('D') + ' de ' + moment(start).add(sum1, 'days').format('MMMM')
  const day2 = moment(start).add(sum2, 'days').format('D') + ' de ' + moment(start).add(sum2, 'days').format('MMMM')
  const day3 = moment(start).add(sum3, 'days').format('D') + ' de ' + moment(start).add(sum3, 'days').format('MMMM')
  return day1 + ', ' + day2 + ' y ' + day3
}

const getSubstitutions = ({ course, linked, assigned }) => {
  const substitutions = {
    nombre: linked.shortName,
    username: linked.username,
    password: linked.password,
    curso: course.name,
    shortName: course.shortName,
    inicio: getStart(),
    precio: course.price,
    precio_oferta: course.priceOffert,
    horas: course.academicHours,
    brochure: MEDIA_PATH + course.brochure,
    celular: assigned.mobile
  }
  
  return substitutions
}

const changeStatus = async (dataDeal, deal, assigned, body) => {
  try {
    if (dataDeal.status === 'Perdido') {
      dataDeal.isClosed = true
      dataDeal.statusActivity = 'done'
      dataDeal.status = 'Perdido'
      decProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Perdido] ${body.lostReason}`
      })
    }
    if (dataDeal.status === 'Pausado') {
      dataDeal.isClosed = true
      dataDeal.statusActivity = 'done'
      dataDeal.status = 'Pausado'
      decProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Pausado] ${body.pauseReason}`
      })
    }
    if (deal.status !== 'Abierto' && dataDeal.status === 'Abierto') {
      dataDeal.isClosed = false
      dataDeal.statusActivity = 'todo'
      dataDeal.status = 'Abierto'
      incProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Reabierto]`
      })
    }

    if (dataDeal.reassigned) {
      dataDeal.isClosed = false
      dataDeal.statusActivity = 'todo'
      dataDeal.status = 'Abierto'
      incProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Reasignado] ${body.reassignedReason}`
      })
    }

    if (dataDeal.traslate) {
      // dataDeal.isClosed = false
      // dataDeal.statusActivity = 'todo'
      // dataDeal.status = 'Abierto'
      incProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned: body.previousAssessor,
        type: 'Deal',
        name: `[Trato Trasaladado] ${body.traslateReason ? body.traslateReason : ' '} por ${body.previousAssessor && body.previousAssessor.username}`
      })
    }
    return dataDeal
  } catch (error) {
    console.log(error)
    throw error
  }
}

const incProspects = async deal => {
  try {
    await userDB.update(deal.assessor.ref, { $inc: { prospects: 1 } })
  } catch (error) {
    console.log('error inc prospects', deal.assessor, error)
  }
}

const decProspects = async deal => {
  try {
    await userDB.update(deal.assessor.ref, { $inc: { prospects: -1 } })
  } catch (error) {
    console.log('error dec prospects', deal.assessor, error)
  }
}

const timelineProgress = (updateDeal, deal, assigned) => {
  if (updateDeal.progress && deal.progress) {
    const oldRef = deal.progress.ref.toString()
    const oldName = deal.progress.name
    const newRef = updateDeal.progress.ref.toString()
    const newName = updateDeal.progress.name
    if (oldRef !== newRef) {
      createTimeline({
        linked: updateDeal.client,
        deal,
        assigned,
        type: 'Etapa',
        name: `${oldName} → ${newName}`
      })
    }
  }
  if (updateDeal.progressPayment && deal.progressPayment) {
    const oldRef = deal.progressPayment.ref.toString()
    const oldName = deal.progressPayment.name
    const newRef = updateDeal.progressPayment.ref.toString()
    const newName = updateDeal.progressPayment.name
    if (oldRef !== newRef) {
      createTimeline({
        linked: updateDeal.linked,
        deal,
        assigned,
        type: 'Etapa',
        name: `${oldName} → ${newName}`
      })
    }
  }
  if (updateDeal.statusPayment === 'Pago' && deal.status === 'Ganado') {
    createTimeline({
      linked: updateDeal.client,
      deal: updateDeal,
      assigned: updateDeal.assessor,
      type: 'Deal',
      name: `[Trato Completado]`
    })
  }
}

const addCoursesMoodle = async (student, courses, dealId, loggedUser, logged) => {
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  // console.log('student && student.ref && student.ref._id', student)
  let user = await userDB.detail({
    query: { _id: student && student.ref && student.ref._id }
  })
  const timeline = {
    linked: {
      ...user.toJSON(),
      ref: user._id
    },
    assigned: {
      username: loggedUser.username,
      ref: loggedUser._id
    },
    deal: deal,
    type: 'Curso'
  }

  console.log('timeline', timeline)
  const code = randomize('0', 8)
  if (!user.moodleId) {
    // console.log('registrar usuario moodle')
    const exist = await searchUser({
      username: user.username,
      email: user.email
    })
    // console.log('exist', exist)
    if (exist && exist.user) {
      const err = {
        status: 402,
        message: `Ya existe un usuario con el mismo ${exist.type}`
      }
      throw err
    }
    
    const moodleUser = await createNewUserMoodle({
      ...user.toJSON(),
      username: student.username,
      password: code
    })
    
    const dataUser = {
      username: student.username || undefined,
      password: student.password ? generateHash(code) : undefined,
      moodleId: moodleUser.id
    }
    user = await userDB.update(user._id, dataUser)
    user.password = code
    await createTimeline({
      ...timeline,
      name: '[Cuenta] se creó la cuenta en Moodle'
    })
    
    await sendEmailAccess(user.toJSON(), deal.toJSON(), logged)
  }
  console.log('registro de cursos')
  try {
    const coursesEnrol = await Promise.all(
      courses.map(async course => {
        user.password = code
        await createEnrolUserMoodle({ course, user, deal })
        await createTimeline({
          ...timeline,
          name: `[Matricula] ${course.name}`
        })
        return course
      })
    )
    return coursesEnrol
  } catch (error) {
    console.log('error', error)
    if (error.status) {
      throw error
    } else {
      const InvalidError = CustomError('CastError', { message: 'Ocurrio un error al matricular un curso en Moodle', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  }
}

const addCoursesMoodleUpdate = async (student, courses, dealId, loggedUser, logged) => {
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  console.log('deal', deal)
  // console.log('student && student.ref && student.ref._id', student)
  let user = await userDB.detail({
    query: { _id: student && student.ref && student.ref._id }
  })
  console.log('user', user)
  const timeline = {
    linked: {
      ...user.toJSON(),
      ref: user._id
    },
    assigned: {
      username: loggedUser.username,
      ref: loggedUser._id
    },
    deal: deal,
    type: 'Curso'
  }

  console.log('timeline', timeline)
  const code = randomize('0', 8)
  
  if (!user.moodleId) {
    console.log('registrar usuario moodle', user)
    const existUsername = await searchUsername({
      username: user.username
    })
    console.log('existUsername', existUsername)
    const existEmail = await searchEmail(
      user.email
    )
    // console.log('existEmail', existEmail)
    if (existUsername && existEmail) {
      if (existUsername.id === existEmail.id) {
        const dataUser = {
          moodleId: existEmail.id
        }
        user = await userDB.update(user._id, dataUser)
        user.password = code

        await createTimeline({
          ...timeline,
          name: '[Cuenta] la cuenta existente en Moodle'
        })
        await sendEmailAccessExist(user.toJSON(), deal.toJSON(), logged)
      } else {
        const InvalidError = CustomError('InvalidError', { message: 'El username, ya existe en moodle.', code: 'EINVLD' }, CustomError.factory.expectReceive)
        throw new InvalidError()
      }
    } else {
      if (!existUsername && existEmail) {
        const dataUser = {
          username: existEmail.username,
          moodleId: existEmail.id
        }
        user = await userDB.update(user._id, dataUser)
        await createTimeline({
          ...timeline,
          name: '[Cuenta] la cuenta existente en Moodle'
        })
        await sendEmailAccessExist(user.toJSON(), deal.toJSON(), logged)
      } else if (existUsername && !existEmail) {
        const InvalidError = CustomError('InvalidError', { message: 'El username, ya existe en moodle.', code: 'EINVLD' }, CustomError.factory.expectReceive)
        throw new InvalidError()
      } else {
        console.log('entro aquí')
        const userCreateData = {
          ...user.toJSON(),
          username: student.username,
          password: code
        }
        const moodleUser = await createNewUserMoodle(userCreateData)
        console.log('moodleUser', moodleUser)
        const dataUser = {
          username: student.username || undefined,
          password: student.password ? generateHash(code) : undefined,
          moodleId: moodleUser.id
        }
        user = await userDB.update(user._id, dataUser)
        user.password = code

        await createTimeline({
          ...timeline,
          name: '[Cuenta] se creó la cuenta en Moodle'
        })
        await sendEmailAccess(user.toJSON(), deal.toJSON(), logged)
      }
    } 
  } else {
    const existID = await searchID({
      id: user.moodleId
    })
    if (existID) {
      await createTimeline({
        ...timeline,
        name: '[Cuenta] la cuenta existente en Moodle'
      })
      await sendEmailAccessExist(user.toJSON(), deal.toJSON(), logged)
    }
  }
  // console.log('registro de cursos')
  try {
    const coursesEnrol = await Promise.all(
      courses.map(async course => {
        user.password = code
        await createEnrolUserMoodle({ course, user, deal })
        await createTimeline({
          ...timeline,
          name: `[Matricula] ${course.name}`
        })
        return course
      })
    )
    return coursesEnrol
  } catch (error) {
    console.log('error', error)
    if (error.status) {
      throw error
    } else {
      const InvalidError = CustomError('CastError', { message: 'Ocurrio un error al matricular un curso en Moodle', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  }
}

const sendEmailAccess = async (user, deal, logged) => {
  const linked = payloadToData(user)
  const assigned = payloadToData(logged)
  const to = user.email
  const fromname = 'Escuela Americana de Innovación'
  const from = 'cursos@eai.edu.pe'
  const templateId = 'd-1283b20fdf3b411a861b30dac8082bd8'
  const preheader = 'Accesos a Moodle'
  const substitutions = {
    username: linked.username,
    password: user.password,
    nombre: linked.firstName
  }
  console.log('substitutions', substitutions)
  try {
    const email = await createEmail({
      linked: {
        ...linked,
        ref: linked
      },
      assigned: {
        ...assigned,
        ref: assigned
      },
      subject: 'Pasos para acceder a la plataforma de Escuela Americana de Innovación',
      deal: deal,
      from,
      to,
      fromname,
      preheader,
      content: templateAccess(substitutions)
    })
    console.log('email nuevo', email)
    await sendMailTemplate({
      to,
      from,
      fromname,
      substitutions,
      templateId: templateId,
      args: {
        emailId: email._id
      }
    })
  } catch (error) {
    console.log('error create email', error)
  }
}

const sendEmailAccessExist = async (user, deal, logged) => {
  const linked = payloadToData(user)
  const assigned = payloadToData(logged)
  const to = user.email
  const fromname = 'Escuela Americana de Innovación'
  const from = 'cursos@eai.edu.pe'
  const templateId = 'd-aab0311dac2c438fafe536e73e9b36bf'
  const preheader = 'Accesos a Moodle'
  const substitutions = {
    username: linked.username,
    password: user.password,
    nombre: linked.firstName
  }
  console.log('substitutions', substitutions)
  try {
    console.log('existe')
    const email = await createEmail({
      linked: {
        ...linked,
        ref: linked
      },
      assigned: {
        ...assigned,
        ref: assigned
      },
      deal: deal,
      subject: 'Bienvenido a Escuela Americana de Innovación',
      from,
      to,
      fromname,
      preheader,
      content: templateAccessClient(substitutions)
    })
    console.log('email', email)
    await sendMailTemplate({
      to,
      from,
      fromname,
      substitutions,
      templateId: templateId,
      args: {
        emailId: email._id
      }
    })
  } catch (error) {
    console.log('error create email', error)
  }
}

const enrolStudents = async ({ item, dealId, loggedUser }, logged) => {
  try {
    console.log('item', item)
    const student = item.student && item.student.ref ? item.student.ref : item.student
    const id = student && student.ref ? student.ref._id : student._id
    const rolesUser = await userDB.detail({ query: { _id: id } })
    console.log('rolesUser', rolesUser)
    const user = await userDB.update(id, {
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      names: student.names,
      email: student.email,
      dni: student.dni,
      roles: [...rolesUser.roles, 'Estudiante']
    })
    console.log('user', user)

    const enrols = await addCoursesMoodleUpdate(
      item.student,
      item.courses,
      dealId,
      loggedUser,
      logged
    )
    
     const updatedDeal = await dealDB.update(dealId, {
      isClosed: true,
      endDate: new Date()
    })
    emitDeal(updatedDeal)
    return { enrols, updatedDeal }
  } catch (error) {
    throw error
  }
}

module.exports = {
  countDocuments,
  listDeals,
  generalDeals,
  assessorDeals,
  searchDeals,
  dashDeals,
  createDeal,
  mixDeal,
  changeDeal,
  updateDeal,
  updateWinner,
  updateDealOne,
  updateDealCreate,
  detailDeal,
  deleteDeal,
  createOrUpdateDeal,
  addOrUpdateUserDeal,
  createDealUserOnly,
  incProspects,
  addInitialStatus,
  emitDeal,
  emitAccounting,
  enrolStudents
}

