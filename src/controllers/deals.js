'use strict'

const service = require('../services/deal')

const listDeals = async (req, res) => {
  const deals = await service.listDeals(req.query)
  return res.status(200).json(deals)
}

const generalDeals = async (req, res, next) => {
  try {
    const deals = await service.generalDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const assessorDeals = async (req, res, next) => {
  try {
    const deals = await service.assessorDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const searchDeals = async (req, res, next) => {
  try {
    const deals = await service.searchDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const searchOpenDetail = async (req, res, next) => {
  try {
    const deals = await service.searchOpenDetail(req.query)
    let resp = {}
    if (deals.length) {
      const deal = deals[0]
      resp = {
        id: deal._id,
        name: deal.client && deal.client.firstName ? deal.client.firstName : '',
        lastname: deal.client && deal.client.lastName ? deal.client.lastName : '',
        fullname: deal.client && deal.client.names ? deal.client.names : '',
        stage: deal.progress && deal.progress.name ? deal.progress.name : '',
        dni: deal.client && deal.client.dni ? deal.client.dni : '',
        email: deal.client && deal.client.email ? deal.client.email : '',
        dial_code: deal.client && deal.client.mobile ? deal.client.mobile : '',
        country_code: deal.client && deal.client.mobileCode ? deal.client.mobileCode : '',
        asesor: deal.assessor && deal.assessor.username ? deal.assessor.username : ''
      }
    } else {
      resp = {
        error: 'No se encontro'
      }
    }
    return res.status(200).json(resp)
  } catch (error) {
    next(error)
  }
}

const dashDeals = async (req, res, next) => {
  try {
    const deals = await service.dashDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const createDeal = async (req, res, next) => {
  try {
    const deal = await service.createDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const mixDeal = async (req, res, next) => {
  try {
    const deal = await service.mixDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const changeDeal = async (req, res, next) => {
  try {
    const deal = await service.changeDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const reasignDeal = async (req, res, next) => {
  try {
    const deal = await service.reasignDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}



const updateDeal = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDeal(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateDealCourse = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealCourse(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateDealOne = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealOne(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateDealCreate = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealCreate(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateWinner = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateWinner(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const detailDeal = async (req, res, next) => {
  const dealId = req.params.id
  const params = req.query
  if (params.query) {
    if (dealId) {
      params.query._id = dealId
    }
  } else if (dealId) {
    params.query = {
      _id: dealId
    }
  }

  try {
    const deal = await service.detailDeal(params)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const deleteDeal = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.deleteDeal(dealId, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

const createOrUpdate = async (req, res, next) => {
  try {
    const deal = await service.createOrUpdate(req.body)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const enrolDeal = async (req, res, next) => {
  try {
    const deal = await service.enrolStudents(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  countDocuments,
  listDeals,
  generalDeals,
  assessorDeals,
  searchDeals,
  searchOpenDetail,
  dashDeals,
  createDeal,
  mixDeal,
  changeDeal,
  reasignDeal,
  updateDeal,
  updateDealOne,
  updateDealCreate,
  updateDealCourse,
  updateWinner,
  detailDeal,
  deleteDeal,
  createOrUpdate,
  enrolDeal
}
