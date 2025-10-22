'use strict'

const { updateStatusCall, updateStrangerCall, popUpCall } = require('../services/call')

const eventWebhook = async (req, res) => {
  //
  req.body.callService = 'anura'
  const event = req.body
  
  try {
    console.log('event', event)
    await updateStatusCall(event)
  } catch (error) {
    const stranger = event && event.direction && await updateStrangerCall(event)
    console.log('error al actualizar el stado call', stranger, event)
  }
  return res.status(200).json({ success: true })
}

const incomingWebhook = async (req, res) => {
  //
  const event = req.body
  console.log('event', event)
  try {
    await popUpCall(event)
  } catch (error) {
    console.log('error al actualizar el stado call', error)
  }
  return res.status(200).json({ success: true })
}

module.exports = {
  eventWebhook,
  incomingWebhook
}
