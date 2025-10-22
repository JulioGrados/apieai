'use strict'

const { whastsappDB, userDB, dealDB } = require('db/lib')
const { sendCallbell } = require("utils/functions/callbell")

const listWhatsapps = async params => {
  console.log('--------------------------------------------------------')
  console.log('WHATSAPP')
  console.log('--------------------------------------------------------')
  const whatsapps = await whastsappDB.list(params)
  return whatsapps
}

const createWhatsapp = async (body, loggedUser) => {
  const whatsapp = await whastsappDB.create(body)
  return whatsapp
}

const updateWhatsapp = async (whatsappId, body, loggedUser) => {
  const whatsapp = await whastsappDB.update(whatsappId, body)
  return whatsapp
}

const detailWhatsapp = async params => {
  const whatsapp = await whastsappDB.detail(params)
  return whatsapp
}

const sendWhatsapp = async data => { 
  const result = await Promise.all(
    data.map(async item => {
      try {
        
        const user = await userDB.detail({ query: { email: item.email } })
        console.log('user', user)
        const deal = await dealDB.detail({ query: { client: user._id.toString() } })
        console.log('deal', deal)
        
        const info = {
          to: item.phone,
          from: "whatsapp",
          type: "text",
          content: {
            text: item.text
          }
        }

        const send = await sendCallbell(info)
        console.log('send', send)
        if (user && deal) {
          const whatsapp = await whastsappDB.create({
            assigned: {
              username: deal.assessor && deal.assessor.username,
              ref: deal.assessor && deal.assessor.ref,
            },
            linked: {
              names: user.names,
              ref: user._id
            },
            content: item.text,
            deal: deal._id,
            uuid: send.message.uuid,
            phone: item.phone,
            code: item.code,
            status: 'En cola'
          })
          console.log('whatsapp', whatsapp)
        } else {
          const whatsapp = await whastsappDB.create({
            content: item.text,
            uuid: send.message.uuid,
            phone: item.phone,
            code: item.code,
            status: 'En cola'
          })
          console.log('whatsapp', whatsapp)
        }
        return {
          phone: item.phone,
          success: true
        }
      } catch (error) {
        const info = {
          to: item.phone,
          from: "whatsapp",
          type: "text",
          content: {
            text: item.text
          }
        }

        if (error && error.status === 404 && (error.message === 'El usuario que intenta buscar no existe.' || error.message === 'El deal no se encontro')) {
          try {
            const send = await sendCallbell(info)
            console.log('send', send)
            const whatsapp = await whastsappDB.create({
              content: item.text,
              uuid: send.message.uuid,
              phone: item.phone,
              code: item.code,
              status: 'En cola'
            })
            console.log('whatsapp', whatsapp)
            return {
              phone: item.phone,
              success: true
            }
          } catch (error) {
            return {
              phone: item.phone,
              success: false
            }
          }
        } else {
          return {
            phone: item.phone,
            success: false
          }
        }
      }
      
    })
  )
  return result
}

const updateStatusWhatsapp = async (body, loggedCall) => {
  const whastsapp = await whastsappDB.detail({ query: { uuid: body.uuid } })
  
  if (whastsapp) {
    let status = ''
    if (body.status === 'enqueued') {
      status = 'En cola'
    } else if (body.status === 'sent') {
      status = 'Enviado'
    } else if (body.status === 'delivered') {
      status = 'Entregado'
    } else if (body.status === 'read') {
      status = 'Leido'
    } else if (body.status === 'failed') {
      status = 'Rechazado'
    }
    await whastsappDB.update(whastsapp._id, {
      status: status
    })
    console.log('whastsapp', whastsapp)
    console.log('status', status)
  } 
  return body
}

const deleteWhatsapp = async (whatsappId, loggedUser) => {
  const whatsapp = await whastsappDB.remove(whatsappId)
  return whatsapp
}

const countDocuments = async params => {
  const count = await whastsappDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listWhatsapps,
  createWhatsapp,
  updateWhatsapp,
  updateStatusWhatsapp,
  detailWhatsapp,
  sendWhatsapp,
  deleteWhatsapp
}
