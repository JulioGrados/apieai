'use strict'

// const axios = require('axios')

const { messageDB, chatDB } = require('db/lib')

const { getSocket } = require('../lib/io')
// const { emitChat } = require('./chat')

// const accessTok = 'EAAkrZCaNonbkBOZBG4iQRmkmKmTe6pL42IQFWKRb4T4nfRuy5SKA8FabHi54oiJ0HWvTI97bRI911Hd8InHE2yjxwVRCDsq71ueLPpsqM9LoIbhUZCnpWZBj8S4UZB4rXe1993vURqcjOkLfYybOnbANjBQaIB3eq1ZCchQA5hXcR6sJ14k8A1k6s2ZAm5ZCMpZAAxNKrI4fNEvmsBGOwXK2EMmznMyhZCMUoZD'

const listMessages = async params => {
  const message = await messageDB.list(params)
  console.log('message',message)
  return message
}

const createMessage = async (body, loggedMessage) => {
  // try {
  //   console.log('body', body)
  //   const message = body.text
  //   const chat = await chatDB.detail({ query: { _id: body.chatId } })
  //   const response = await axios({
  //     method: 'POST',
  //     url: 'https://graph.facebook.com/v17.0/' + '105473975917574' + '/messages',
  //     data: {
  //       messaging_product: 'whatsapp',
  //       recipient_type: 'individual',
  //       to: chat.mobileCode + chat.mobile,
  //       type: 'text',
  //       text: {
  //         body: message
  //       }
  //     },
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${accessTok}`
  //     }
  //   })
  //   const wamid = response.data && response.data.messages && response.data.messages[0].id
  //   const messageCreate = await messageDB.create({
  //     wamid: wamid,
  //     assigned: body.assigned,
  //     chat: body.chatId,
  //     linked: body.linked,
  //     text: body.text
  //   })
  //   const chatEdit = await chatDB.update(body.chatId, {
  //     lastMessage: body.text,
  //     lastChannel: 'whatsapp',
  //     date: new Date()
  //   })
  //   emitChat(chatEdit)
  //   emitMessage(messageCreate)
  //   return messageCreate
  // } catch (error) {
  //   console.log('error', error)
  //   throw error
  // }
}

const createTemplateMessage = async (body, loggedMessage) => {
  // try {
  //   console.log('body', body)
  //   const message = body.text
  //   const chat = await chatDB.detail({ query: { _id: body.chatId } })
  //   const response = await axios({
  //     method: 'POST',
  //     url: 'https://graph.facebook.com/v17.0/' + '105473975917574' + '/messages',
  //     data: {
  //       messaging_product: 'whatsapp',
  //       recipient_type: 'individual',
  //       to: chat.mobileCode + chat.mobile,
  //       type: 'template',
  //       template: {
  //         name: "TEMPLATE_NAME",
  //         language: {
  //           code: "en_US"
  //         }
  //       },
  //       components: [
  //         {
  //           type: "body",
  //           parameters: [
  //             {
  //               type: "text",
  //               text: "Julio Grados"
  //             }
  //           ]
  //         }
  //       ]
  //     },
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${accessTok}`
  //     }
  //   })
  //   const wamid = response.data && response.data.messages && response.data.messages[0].id
  //   const messageCreate = await messageDB.create({
  //     wamid: wamid,
  //     assigned: body.assigned,
  //     chat: body.chatId,
  //     linked: body.linked,
  //     text: body.text
  //   })
  //   await chatDB.update(body.chatId, {
  //     lastMessage: body.text,
  //     lastChannel: 'whatsapp'
  //   })
  //   emitMessage(messageCreate)
  //   return messageCreate
  // } catch (error) {
  //   console.log('error', error)
  //   throw error
  // }
}

const updateMessage = async (messageId, body, loggedMessage) => {
  const message = await messageDB.update(messageId, body)
  return message
}

const detailMessage = async params => {
  const message = await messageDB.detail(params)
  return message
}

const deleteMessage = async (messageId, loggedMessage) => {
  const message = await messageDB.remove(messageId)
  return message
}

const countDocuments = async params => {
  const count = await messageDB.count(params)
  return count
}

//socket emit
const emitMessage = message => {
  console.log('llamado message', message)
  if (message.assigned) {
    console.log('llamado message')
    const io = getSocket()
    io.to(message.assigned.toString()).emit('message', message)
  }
}

module.exports = {
  countDocuments,
  listMessages,
  createMessage,
  createTemplateMessage,
  updateMessage,
  detailMessage,
  deleteMessage,
  emitMessage
}
