'use strict'

const service = require('../services/claim')

const listClaims = async (req, res) => {
  const claims = await service.listClaims(req.query)
  return res.status(200).json(claims)
}

const createClaim = async (req, res, next) => {
  try {
    const claim = await service.createClaim(req.body, req.claim)
    console.log('claim', claim)
    return res.status(201).json(claim)
  } catch (error) {
    next(error)
  }
}

const updateClaim = async (req, res, next) => {
  const claimId = req.params.id
  try {
    const claim = await service.updateClaim(
      claimId,
      req.body,
      req.claim
    )
    return res.status(200).json(claim)
  } catch (error) {
    next(error)
  }
}

const detailClaim = async (req, res, next) => {
  const claimId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = claimId
  } else {
    params.query = {
      _id: claimId
    }
  }

  try {
    const claim = await service.detailClaim(params)
    return res.status(200).json(claim)
  } catch (error) {
    next(error)
  }
}

const deleteClaim = async (req, res, next) => {
  const claimId = req.params.id
  try {
    const claim = await service.deleteClaim(claimId, req.claim)
    return res.status(201).json(claim)
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
  listClaims,
  createClaim,
  updateClaim,
  detailClaim,
  deleteClaim
}
