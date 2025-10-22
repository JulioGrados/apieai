'use strict'

const service = require('../services/timetable')

const listTimetables = async (req, res) => {
  const timetables = await service.listTimetables(req.query)
  return res.status(200).json(timetables)
}

const createTimetable = async (req, res, next) => {
  try {
    const timetable = await service.createTimetable(req.body, req.timetable)
    return res.status(201).json(timetable)
  } catch (error) {
    next(error)
  }
}

const updateTimetable = async (req, res, next) => {
  const timetableId = req.params.id
  try {
    const timetable = await service.updateTimetable(
      timetableId,
      req.body,
      req.timetable
    )
    return res.status(200).json(timetable)
  } catch (error) {
    next(error)
  }
}

const detailTimetable = async (req, res, next) => {
  const timetableId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = timetableId
  } else {
    params.query = {
      _id: timetableId
    }
  }

  try {
    const timetable = await service.detailTimetable(params)
    return res.status(200).json(timetable)
  } catch (error) {
    next(error)
  }
}

const deleteTimetable = async (req, res, next) => {
  const timetableId = req.params.id
  try {
    const timetable = await service.deleteTimetable(timetableId, req.timetable)
    return res.status(201).json(timetable)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listTimetables,
  createTimetable,
  updateTimetable,
  detailTimetable,
  deleteTimetable
}
