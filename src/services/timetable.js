'use strict'

const { timetableDB } = require('db/lib')

const listTimetables = async params => {
  console.log('--------------------------------------------------------')
  console.log('TIMEtable')
  console.log('--------------------------------------------------------')
  const timetables = await timetableDB.list(params)
  return timetables
}

const createTimetable = async ({ linked, assigned, ...body }) => {
  // console.log('assigned', assigned)
  if (linked) {
    body.linked = {
      username: linked.username,
      ref: linked._id || linked.ref
    }
  }
  // console.log('body timetable', body)
  try {
    const timetable = await timetableDB.create(body)
    emitTimetable(timetable)
    return timetable
  } catch (error) {
    console.log('error timetable', body, error)
  }
}

const detailTimetable = async params => {
  const timetable = await timetableDB.detail(params)
  return timetable
}

const countDocuments = async params => {
  const count = await timetableDB.count(params)
  return count
}

/* functions */

module.exports = {
  countDocuments,
  listTimetables,
  createTimetable,
  detailTimetable
}
