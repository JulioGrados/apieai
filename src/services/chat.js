'use strict'

// const axios = require('axios')

const { messageDB, chatDB, userDB } = require('db/lib')

const { getSocket } = require('../lib/io')

// const accessTok = 'EAAkrZCaNonbkBOZBG4iQRmkmKmTe6pL42IQFWKRb4T4nfRuy5SKA8FabHi54oiJ0HWvTI97bRI911Hd8InHE2yjxwVRCDsq71ueLPpsqM9LoIbhUZCnpWZBj8S4UZB4rXe1993vURqcjOkLfYybOnbANjBQaIB3eq1ZCchQA5hXcR6sJ14k8A1k6s2ZAm5ZCMpZAAxNKrI4fNEvmsBGOwXK2EMmznMyhZCMUoZD'

const listChats = async params => {
  const chat = await chatDB.list(params)
  return chat
}

const createChat = async (body, loggedChat) => {
  // console.log('body', body)
  // // const chat = await chatDB.create(body)
  // // return chat
  // try {
  //   const assigned = await userDB.detail({ query: { phoneNoId: '105473975917574' } })
  //   console.log('assigned', assigned)
  //   const user = await userDB.detail({ query: { mobile: body.mobile } })
  //   console.log('user', user)
  //   const response = await axios({
  //     method: 'POST',
  //     url: 'https://graph.facebook.com/v17.0/' + '105473975917574' + '/messages',
  //     data: {
  //       messaging_product: 'whatsapp',
  //       recipient_type: 'individual',
  //       to: body.mobileCode + '' + body.mobile,
  //       type: 'template',
  //       template: {
  //         name: "hello_world",
  //         language: {
  //           code: "en_US"
  //         }
  //       }
  //     },
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${accessTok}`
  //     }
  //   })
  //   console.log('response', response)
  //   const chat = await chatDB.create({
  //     linked: user._id.toString(),
  //     assigned: assigned._id.toString(),
  //     lastMessage: 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.',
  //     mobile: body.mobile,
  //     mobileCode: body.mobileCode
  //   })
  //   console.log('chat', chat)
  //   const wamid = response.data && response.data.messages && response.data.messages[0].id
  //   console.log('wamid', wamid)
  //   await messageDB.create({
  //     wamid: wamid,
  //     linked: assigned._id.toString(),
  //     assigned: assigned._id.toString(),
  //     chat: chat._id.toString(),
  //     text: 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.'
  //   })

  //   emitChat(chat)
  //   return chat
  // } catch (error) {
  //   console.log('error', error.response.data.error)
  //   throw error
  // }
}

const updateChat = async (chatId, body, loggedChat) => {
  const chat = await chatDB.update(chatId, body)
  return chat
}

const detailChat = async params => {
  const chat = await chatDB.detail(params)
  return chat
}

const deleteChat = async (chatId, loggedChat) => {
  const chat = await chatDB.remove(chatId)
  return chat
}

const countDocuments = async params => {
  const count = await chatDB.count(params)
  return count
}

//socket emit
const emitChat = chat => {
  console.log('llamado chat', chat)
  if (chat.assigned) {
    console.log('llamado chat')
    const io = getSocket()
    io.to(chat.assigned.toString()).emit('chat', chat)
  }
}

module.exports = {
  countDocuments,
  listChats,
  createChat,
  updateChat,
  detailChat,
  deleteChat,
  emitChat
}
