'use strict'

const { callDB, notificationDB, dealDB } = require('db/lib')
const moment = require('moment-timezone')
const CustomError = require('custom-error-instance')

const { getSocket } = require('../lib/io')
const { getNewActivityState, getFullDate } = require('utils/functions/call')
const { userDB } = require('db/lib')
const { searchCodeNumber } = require('../controllers/users')

const { api } = require('utils/functions/zadarma')
const { createFile, getDocumentTokenExpired, createToken, getDocumentToken } = require('utils/functions/google')
const { downloadAudio } = require('utils/functions/audio')
const { deletefile } = require('utils/functions/deletefile')

const listCalls = async params => {
  console.log('--------------------------------------------------------')
  console.log('LLAMADAS')
  console.log('--------------------------------------------------------')
  console.log('params', params)
  const calls = await callDB.list(params)
  return calls
}

const listCallsGoogle = async () => {
  const list = await callDB.list({
    query: {
      record: { $exists: true, $ne: "" },
      date: {
        $gte: moment().subtract(1, 'days').startOf('day'),
        $lte: moment().startOf('day')
      },
    }
  })
  return list
}

const uploadCallAudio = async (calls) => {
  const timer = ms => new Promise(res => setTimeout(res, ms))

  async function load () { // We need to wrap the loop into an async function for this to work
    for (var i = 0; i < calls.length; i++) {
      await uploadDriveAudio(calls[i])
      await timer(1000); // then the created Promise can be awaited
    }
  }

  await load();
}

const createCall = async (body, loggedCall) => {
  await validateExistCall(body)
  const call = await callDB.create(body)
  const deal = await updateUserStateFromCall(call)
  // emitDeal(deal)
  return call
}

const updateCall = async (callId, body, loggedCall) => {
  const call = await callDB.update(callId, body)
  const deal =  await updateUserStateFromCall(call)
  // emitDeal(deal)
  return call
}


const updateStatusCall = async (body, loggedCall) => {
  const deal = await searchDeal(body)
  const dataCall = await prepareCall(body, deal)
  const call = await callDB.create(dataCall)
  emitCall(call)
  return call
}

const updateStatusZadarmaCall = async (body, loggedCall) => {
  const deal = await searchZadarmaDeal(body)
  const dataCall = await prepareZadarmaCall(body, deal)
  console.log('dataCall', dataCall)
  const call = await callDB.create(dataCall)
  console.log('call', call)
  emitCall(call)
  return call
}

const updateStrangerCall = async (body) => {
  const called = body.called
  const calling = body.calling
  const phone = body.direction === 'OUT' ? called.substring(4, called.length) : called
  
  const dataCall = {
    direction: body.direction,
    cdrid: body.cdrid,
    callingname: body.callingname,
    calling: calling,
    called: phone,
    code: '51',
    country: 'PE',
    status: getStatusCalls(body.status),
    duration: body.duration,
    billseconds: body.billseconds,
    price: body.price,
    isCompleted: true,
    callService: body.callService ? body.callService : 'crm',
    service: true,
    hour: moment(body.dialtime)
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(body.dialtime)
  }

  const call = await callDB.create(dataCall)
  return call
}

const updateStrangerZadarmaCall = async (body) => {
  const phone = body.destination && (body.destination[0] === '+') ? parseInt(body.destination.replace('+', ''), 10) : parseInt(body.destination, 10)
  const { code, country } = phone && searchCodeNumber(phone.toString())

  const dataCall = {
    direction: 'OUT',
    cdrid: body.pbx_call_id,
    callingname: body.internal,
    calling: body.internal,
    called: phone && phone.toString().replace(code, ''),
    code: code,
    country: country.code,
    status: getStatusZadarmaCalls(body.disposition),
    duration: body.duration,
    billseconds: body.duration,
    price: '-',
    isCompleted: true,
    service: true,
    callService: body.callService ? body.callService : 'crm',
    hour: moment(body.call_start)
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(body.call_start),
    record: body.call_id_with_rec ? body.call_id_with_rec : ''
  }

  const call = await callDB.create(dataCall)
  return call
}

const popUpCall = async (body, loggedCall) => {
  const assessors = await userDB.list({
    query: {
      roles: 'Asesor'
    }
  })

  const receptionist = assessors.find(assessor => assessor.roles && assessor.roles.includes('Recepcionista') === true)
  // const receptionist = await userDB.detail({
  //   query: {
  //     roles: 'Recepcionista'
  //   }
  // })
  // console.log('receptionist', receptionist)
  // Asesor que este activo de acuerdo al trato
  // Activo, mandar la notificación
  // Inactivo o no tiene trato a recepcionista 
  
  try {
    const deal = await searchDeal(body)
    const dataDeal = {
      ...deal.toJSON(),
      exist: true
    }

    const assigend = deal && deal.assessor && deal.assessor.ref
    const assessor = assigend && assessors.find(item => item._id.toString() === assigend.toString())

    // console.log('assigend', assigend)
    // console.log('assessor', assessor)
    emitPopUp(dataDeal, receptionist)
    
    if ( assessor && assessor.status ) {
      emitPopUp(dataDeal, assessor)
    } 
    // else {
    //   emitPopUp(dataDeal, receptionist)
    // }
    
    return deal
  } catch (error) {
    const dataDeal = {
      ...body,
      exist: false
    }
    emitPopUp(dataDeal, receptionist)
  }
}

const popUpZadarmaCall = async (body, loggedCall) => {
  const assessors = await userDB.list({
    query: {
      roles: 'Asesor'
    }
  })

  const receptionist = assessors.find(assessor => assessor.roles && assessor.roles.includes('Recepcionista') === true)
  // const receptionist = await userDB.detail({
  //   query: {
  //     roles: 'Recepcionista'
  //   }
  // })
  // console.log('receptionist', receptionist)
  // Asesor que este activo de acuerdo al trato
  // Activo, mandar la notificación
  // Inactivo o no tiene trato a recepcionista 
  
  try {
    const deal = await searchZadarmaIncomingDeal(body)
    const dataDeal = {
      ...deal.toJSON(),
      exist: true
    }

    const assigend = deal && deal.assessor && deal.assessor.ref
    const assessor = assigend && assessors.find(item => item._id.toString() === assigend.toString())

    // console.log('assigend', assigend)
    // console.log('assessor', assessor)
    emitPopUp(dataDeal, receptionist)
    
    if ( assessor && assessor.status ) {
      emitPopUp(dataDeal, assessor)
    } 
    // else {
    //   emitPopUp(dataDeal, receptionist)
    // }
    
    return deal
  } catch (error) {
    const dataDeal = {
      calling: body.caller_id,
      exist: false
    }
    emitPopUp(dataDeal, receptionist)
  }
}

const detailCall = async params => {
  const call = await callDB.detail(params)
  return call
}

const deleteCall = async (callId, loggedCall) => {
  const call = await callDB.remove(callId)
  return call
}

const countDocuments = async params => {
  const count = await callDB.count(params)
  return count
}

/* functions */

const prepareCall = async (body, deal) => {
  const lastCall = await callDB.list({
    query: { deal: deal._id },
    sort: '-createdAt'
  })
  const called = body.called
  const calling = body.calling
  const phone = body.direction === 'OUT' ? called.substring(4, called.length) : called

  

  const number = lastCall ? lastCall.length + 1 : 1
  const dataCall = {
    name: `Llamada ${number}`,
    number,
    direction: body.direction,
    cdrid: body.cdrid,
    callingname: body.callingname,
    calling: calling,
    called: phone,
    code: '51',
    country: 'PE',
    status: getStatusCalls(body.status),
    duration: body.duration,
    billseconds: body.billseconds,
    price: body.price,
    callService: body.callService ? body.callService : 'crm',
    isCompleted: true,
    service: true,
    
    hour: moment(body.dialtime)
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(body.dialtime),
    assigned: deal.assessor,
    linked: {
      names: deal.client.names,
      ref: deal.client._id
    },
    deal: deal._id
  }
  return dataCall
}

const prepareZadarmaCall = async (body, deal) => {
  const lastCall = await callDB.list({
    query: { deal: deal._id },
    sort: '-createdAt'
  })
  
  const phone = body.destination && (body.destination[0] === '+') ? parseInt(body.destination.replace('+', ''), 10) : parseInt(body.destination, 10)
  const { code, country } = phone && searchCodeNumber(phone.toString())
  
  const number = lastCall ? lastCall.length + 1 : 1
  const dataCall = {
    name: `Llamada ${number}`,
    number,
    direction: 'OUT',
    cdrid: body.pbx_call_id,
    callingname: body.internal,
    calling: body.internal,
    called: phone && phone.toString().replace(code, ''),
    status: getStatusZadarmaCalls(body.disposition),
    duration: body.duration,
    billseconds: body.duration,
    price: '-',
    isCompleted: true,
    service: true,
    callService: body.callService ? body.callService : 'crm',
    code: code && code,
    country: country && country.code,
    hour: moment(body.call_start)
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(body.call_start),
    assigned: deal.assessor,
    linked: {
      names: deal.client.names,
      ref: deal.client._id
    },
    deal: deal._id,
    record: body.call_id_with_rec ? body.call_id_with_rec : ''
  }
  return dataCall
}

const searchDeal = async (body) => {
  const called = body.called
  const calling = body.calling
  const phone = body.direction === 'OUT' ? called.substring(4, called.length) : calling

  try {
    const user = await userDB.detail({ query: { mobile: phone } })
    const deal = await dealDB.detail({ query: { client: user._id }, populate: { path: 'client' } })
    return deal
  } catch (error) {
    throw error
  }
}

const searchZadarmaDeal = async (body) => {
  const phone = (body.destination[0] === '+') ? parseInt(body.destination.replace('+', ''), 10) : parseInt(body.destination, 10)
  const { code, country } = phone && searchCodeNumber(phone.toString())
  console.log(phone.toString().replace(code, ''))
  try {
    const user = await userDB.detail({ query: { mobile: phone.toString().replace(code, '') } })
    console.log('user', user)
    const deal = await dealDB.detail({ query: { client: user._id }, populate: { path: 'client' } })
    console.log('deal', deal)
    return deal
  } catch (error) {
    throw error
  }
}

const searchZadarmaIncomingDeal = async (body) => {
  const phone = (body.caller_id[0] === '+') ? parseInt(body.caller_id.replace('+', ''), 10) : parseInt(body.caller_id, 10)
  const { code, country } = phone && searchCodeNumber(phone.toString())
  console.log(phone.toString().replace(code, ''))
  try {
    const user = await userDB.detail({ query: { mobile: phone.toString().replace(code, '') } })
    console.log('user', user)
    const deal = await dealDB.detail({ query: { client: user._id }, populate: { path: 'client' } })
    console.log('deal', deal)
    return deal
  } catch (error) {
    throw error
  }
} 

const getStatusCalls = (event) => {
  
  switch (event) {
    case 'ANSWER':
      return 'Contestó'
    case 'CANCEL':
      return 'No contestó'
    case 'CONGESTION':
      return 'Congestion'
    default:
      return event
  }
}

const getStatusZadarmaCalls = (event) => {
  
  switch (event) {
    case 'answered':
      return 'Contestó'
    case 'cancel':
      return 'No contestó'
    case 'failed':
      return 'No contestó'
    case 'congestion':
      return 'Congestion'
    default:
      return event
  }
}

const getDelayCalls = async () => {
  // console.log('start', moment().subtract(1, 'days').endOf('day'))
  // console.log('start', moment().endOf('day'))
  const calls = await callDB.list({
    query: {
      isCompleted: false,
      // date: {
      //   $gte: moment().subtract(2, 'days').startOf('day'),
      //   $lte: moment().startOf('day')
      // },
      deal: { $exists: true }
    },
    populate: {
      path: 'deal',
      match: { statusActivity: { $ne: 'delay' } },
      select: 'statusActivity'
    }
  })

  // console.log('calls', calls)

  calls.map(async call => {
    if (call.deal) {

      await updateUserStateFromCall(call, true)
    }
  })
}

const updateUserStateFromCall = async (call, emit) => {
  let deal = await getDealFromCall(call)
  // console.log('deal', deal)
  const statusActivity = getNewActivityState(call)
  // console.log('statusActivity', statusActivity)
  // console.log('deal.statusActivity', deal.statusActivity)
  if (statusActivity !== deal.statusActivity) {
    // if (statusActivity === 'delay') {
    //   sendNotification(call, deal)
    // }
    deal = await updateStatusDeal(deal, statusActivity)
  }
  if (emit) {
    emitCall(call, deal)
  }
  return deal
}

const getDealFromCall = async call => {
  let deal
  if (call.deal && call.deal.statusActivity) {
    deal = call.deal
  } else {
    deal = await dealDB.detail({
      query: { _id: call.deal },
      select: 'statusActivity'
    })
  }
  return deal
}

const updateStatusDeal = async (deal, statusActivity) => {
  try {
    const updatedDeal = await dealDB.update(deal._id, { statusActivity }, false)
    return updatedDeal
  } catch (error) {
    console.log('error update user', deal, statusActivity, error)
  }
}

const emitDeal = deal => {
  if (deal.assessor) {
    console.log('llamado deal')
    const io = getSocket()
    io.to(deal.assessor.ref).emit('deal', deal)
  }
}

const emitCall = call => {
  if (call.assigned) {
    console.log('llamado call')
    const io = getSocket()
    io.to(call.assigned.ref).emit('call', call)
  }
}

const emitPopUp = (deal, assigned) => {
  if (assigned) {
    console.log('llamada entrante')
    const io = getSocket()
    io.to(assigned._id).emit('popup', deal)
  }
}

const sendNotification = async (call, deal) => {
  const date = getFullDate(call)
  const data = {
    assigned: call.assigned.ref,
    linked: call.linked.ref,
    deal: deal._id,
    type: 'Llamada',
    typeRef: call._id,
    title: `Llamar a ${call.linked.names}`,
    content: `Se programo una llamada a ${
      call.linked.names
    } para ${date.calendar()}.`
  }
  try {
    const noti = await notificationDB.create(data)
    emitNotification(noti)
  } catch (error) {
    console.log('error create noti', data, error)
  }
}

const emitNotification = notification => {
  if (notification.assigned) {
    const io = getSocket()
    io.to(notification.assigned).emit('notification', notification)
  }
}

const validateExistCall = async body => {
  // if (body.isCompleted === true) {
  //   return true
  // }
  try {
    const exist = await callDB.list({
      query: {
        isCompleted: { $ne: true },
        'linked.ref': body.linked.ref,
        deal: body.deal
      },
      select: '_id'
    })
    console.log('exist', exist)
    if (exist.length > 0) {
      const InvalidError = CustomError('InvalidError', { message: 'No puedes tener más de una llamada pendiente, completa las demas para poder crear una nueva.', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
    } else {
      return true
    }
  } catch (error) {
    throw error
  }
}

const uploadDriveAudio = async (event) => {
  try {
    let record = await api({
      api_method: '/v1/pbx/record/request/',
      params: {
        call_id: event.record
      }
    })
    let file
    console.log('record', record)
    if (record.data && record.data.link) {
      const data = await downloadAudio(record.data.link)
      console.log('data', data)
      const valid = await getDocumentTokenExpired()
      console.log('valid', valid)
      if (valid) {
        const token = await createToken()
        console.log('token 1', token)
        file = await createFile(event.record, data, token)
      } else {
        const token = await getDocumentToken()
        console.log('token 2', token)
        file = await createFile(event.record, data, token)
      }
      console.log('file', file)
      return file
    } else {
      return {
        file: 'no existe'
      }
    }
  } catch (error) {
    return true
  }
}

const deleteFilesAudio = async (files) => {
  const filesDelete = files.map(async element => {
    try {
      const removefile = await deletefile(element, '/audio/')
      return removefile
    } catch (error) {
      throw error
    }
  })  
}

module.exports = {
  countDocuments,
  listCalls,
  listCallsGoogle,
  uploadCallAudio,
  createCall,
  updateCall,
  detailCall,
  deleteCall,
  popUpCall,
  popUpZadarmaCall,
  getDelayCalls,
  updateStatusCall,
  updateStatusZadarmaCall,
  updateStrangerCall,
  updateStrangerZadarmaCall,
  uploadDriveAudio,
  deleteFilesAudio
}
