'use strict'

const { updateStatusCharge } = require("../services/charge")

const eventWebhook = async (req, res) => {
  //
  console.log('req', req)
  const event = req.body.payment
  try {
    console.log('event', event)
    await updateStatusCharge(event)
  } catch (error) {
    // const stranger = event && event.direction && await updateStrangerCall(event)
    // console.log('error al actualizar el stado call', stranger, event)
  }
  return res.status(200).json({ code: 200, message: 'payment successfully notified' })
}

module.exports = {
  eventWebhook
}
