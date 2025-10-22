'use strict'

const { timelineDB, dealDB } = require('db/lib')
const { getSocket } = require('../lib/io')

const listTimelines = async params => {
  console.log('--------------------------------------------------------')
  console.log('TIMELINE')
  console.log('--------------------------------------------------------')
  const timelines = await timelineDB.list(params)
  return timelines
}

const createTimeline = async ({ linked, assigned, ...body }) => {
  // console.log('assigned', assigned)
  if (linked) {
    body.linked = {
      names: linked.names,
      ref: linked._id || linked.ref
    }
  }
  // console.log('assigned', assigned)
  if (assigned) {
    body.assigned = {
      username: assigned.username,
      ref: assigned._id ? assigned._id : assigned.ref ? assigned.ref._id ? assigned.ref._id  : assigned.ref : assigned.ref
    }
  }
  // console.log('body timeline', body)
  try {
    const timeline = await timelineDB.create(body)
    emitTimeline(timeline)
    return timeline
  } catch (error) {
    console.log('error timeline', body, error)
  }
}

const createTimelineNotTimereal = async ({ linked, assigned, ...body }) => {
  // console.log('assigned', assigned)
  if (linked) {
    body.linked = {
      names: linked.names,
      ref: linked._id || linked.ref
    }
  }
  // console.log('assigned', assigned)
  if (assigned) {
    body.assigned = {
      username: assigned.username,
      ref: assigned._id ? assigned._id : assigned.ref ? assigned.ref._id ? assigned.ref._id  : assigned.ref : assigned.ref
    }
  }
  // console.log('body timeline', body)
  try {
    const timeline = await timelineDB.create(body)
    return timeline
  } catch (error) {
    console.log('error timeline', body, error)
  }
}

const createTimelineOff = async ({ linked, assigned, ...body }) => {
  // console.log('assigned', assigned)
  if (linked) {
    body.linked = {
      names: linked.names,
      ref: linked._id || linked.ref
    }
  }
  // console.log('assigned', assigned)
  if (assigned) {
    body.assigned = {
      username: assigned.username,
      ref: assigned._id ? assigned._id : assigned.ref ? assigned.ref._id ? assigned.ref._id  : assigned.ref : assigned.ref
    }
  }
  console.log('body timeline', body)
  try {
    const timeline = await timelineDB.create(body)
    // console.log('timeline', timeline)
    return timeline
  } catch (error) {
    console.log('error timeline', body, error)
  }
}

const crupdTimeline = async (body, loggedUser) => {
  const { progress, deal, pipe } = body
  console.log('progress', progress)
  console.log('deal', deal)
  console.log('pipe', pipe)
  //se busca trato enviado
  const dealOr = await dealDB.detail({
    query: { _id: deal },
    populate: { path: 'client' }
  })
  console.log('dealOr', dealOr)
  //se actualiza trato con nuevo progreso enviado
  let dealUpdate
  if (pipe === 'deals') {
    dealUpdate = await dealDB.update(deal, {
      progress: progress
    })  
  } else {
    dealUpdate = await dealDB.update(deal, {
      progressPayment: progress
    })
  }
  console.log('dealUpdate', dealUpdate)
  //el timeline se crea y envía 
  const timeline = await timelineProgress(dealUpdate.toJSON(), dealOr.toJSON(), loggedUser)
  console.log('timeline', timeline)
  return { timeline: timeline, deal: dealUpdate }
}

const timelineProgress = async (updateDeal, deal, assigned) => {
  let timeline = null
  if (updateDeal.progress && deal.progress) {
    const oldRef = deal.progress.ref.toString()
    const oldName = deal.progress.name
    const newRef = updateDeal.progress.ref.toString()
    const newName = updateDeal.progress.name
    if (oldRef !== newRef) {
      timeline = await createTimelineOff({
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
      timeline = await createTimelineOff({
        linked: updateDeal.linked,
        deal,
        assigned,
        type: 'Etapa',
        name: `${oldName} → ${newName}`
      })
    }
  }
  if (updateDeal.statusPayment === 'Pago' && deal.status === 'Ganado') {
    timeline = await createTimelineOff({
      linked: updateDeal.client,
      deal: updateDeal,
      assigned: updateDeal.assessor,
      type: 'Deal',
      name: `[Trato Completado]`
    })
  }
  return timeline
}

const detailTimeline = async params => {
  const timeline = await timelineDB.detail(params)
  return timeline
}

const countDocuments = async params => {
  const count = await timelineDB.count(params)
  return count
}

/* functions */

const emitTimeline = timeline => {
  console.log('timeline emitTimeline', timeline)
  try {
    if (timeline.assigned) {
      const io = getSocket()
      io.to(timeline.assigned.ref).emit('timeline', timeline)
    }
  } catch (error) {
    console.log('error sockets', timeline, error)
  }
}

module.exports = {
  countDocuments,
  listTimelines,
  createTimeline,
  createTimelineNotTimereal,
  crupdTimeline,
  detailTimeline
}
