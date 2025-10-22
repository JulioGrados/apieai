'use strict'

const service = require('../services/timeline')

const listTimelines = async (req, res) => {
  const timelines = await service.listTimelines(req.query)
  return res.status(200).json(timelines)
}

const createTimeline = async (req, res, next) => {
  try {
    const timeline = await service.createTimeline(req.body, req.timeline)
    return res.status(201).json(timeline)
  } catch (error) {
    next(error)
  }
}

const crupdTimeline = async (req, res, next) => {
  try {
    const timeline = await service.crupdTimeline(req.body, req.user)
    return res.status(201).json(timeline)
  } catch (error) {
    next(error)
  }
}

const updateTimeline = async (req, res, next) => {
  const timelineId = req.params.id
  try {
    const timeline = await service.updateTimeline(
      timelineId,
      req.body,
      req.timeline
    )
    return res.status(200).json(timeline)
  } catch (error) {
    next(error)
  }
}

const detailTimeline = async (req, res, next) => {
  const timelineId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = timelineId
  } else {
    params.query = {
      _id: timelineId
    }
  }

  try {
    const timeline = await service.detailTimeline(params)
    return res.status(200).json(timeline)
  } catch (error) {
    next(error)
  }
}

const deleteTimeline = async (req, res, next) => {
  const timelineId = req.params.id
  try {
    const timeline = await service.deleteTimeline(timelineId, req.timeline)
    return res.status(201).json(timeline)
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
  listTimelines,
  createTimeline,
  crupdTimeline,
  updateTimeline,
  detailTimeline,
  deleteTimeline
}
