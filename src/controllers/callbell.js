'use strict'

const { updateStatusWhatsapp } = require('../services/whatsapp')

const eventWebhook = async (req, res) => {
  //callbell eventos activos de creación y estado
  const event = req.body
  console.log('event', event)
  if (event.event === 'message_status_updated') {
    await updateStatusWhatsapp(event.payload)
  } 
  return res.status(200).json({ success: true })
}

module.exports = {
  eventWebhook
}
