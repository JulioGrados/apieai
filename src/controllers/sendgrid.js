'use strict'

const { updateStatusEmail } = require('../services/email')

const eventWebhook = async (req, res) => {
  //
  const events = req.body
  Promise.all(
    events.map(async event => {
      if (event.emailId) {
        try {
          console.log('event', event)
          await updateStatusEmail(event)
        } catch (error) {
          console.log('error al actualizar el stado email', event, error)
        }
      }
    })
  )
  return res.status(200).json({ success: true })
}

module.exports = {
  eventWebhook
}
