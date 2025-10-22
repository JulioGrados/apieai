'use strict'

// const axios = require('axios')
// const FormData = require('form-data')
// const fs = require('fs')
// const Path = require("path");

// const whatsAppClient = require("@green-api/whatsapp-api-client")
// const apiTokenInstance = "68393e121030467c8da410c04ca1ac19f3c7cab9b71c48c782"
// const idInstance = "1101829293"

const { MEDIA_PATH } = require('utils/files/path')

const service = require('../services/whatsapp')
const { csv2json } = require('utils/functions/csv')
// const { searchCodeNumber } = require('./users')
// const { userDB, chatDB, messageDB } = require('db/lib')
// const { emitChat } = require('../services/chat')
// const { emitMessage } = require('../services/message')
// const accessTok = 'EAAkrZCaNonbkBOZBG4iQRmkmKmTe6pL42IQFWKRb4T4nfRuy5SKA8FabHi54oiJ0HWvTI97bRI911Hd8InHE2yjxwVRCDsq71ueLPpsqM9LoIbhUZCnpWZBj8S4UZB4rXe1993vURqcjOkLfYybOnbANjBQaIB3eq1ZCchQA5hXcR6sJ14k8A1k6s2ZAm5ZCMpZAAxNKrI4fNEvmsBGOwXK2EMmznMyhZCMUoZD'
// const myToken = 'raquem'

const listWhatsapps = async (req, res) => {
  const whatsapps = await service.listWhatsapps(req.query)
  return res.status(200).json(whatsapps)
}

const createWhatsapp = async (req, res, next) => {
  try {
    const whatsapp = await service.createWhatsapp(req.body, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const updateWhatsapp = async (req, res, next) => {
  const whatsappId = req.params.id
  try {
    const whatsapp = await service.updateWhatsapp(
      whatsappId,
      req.body,
      req.whatsapp
    )
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const detailWhatsapp = async (req, res, next) => {
  const whatsappId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = whatsappId
  } else {
    params.query = {
      _id: whatsappId
    }
  }

  try {
    const whatsapp = await service.detailWhatsapp(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const sendWhatsapp = async (req, res, next) => {
  const data = await csv2json(req.files.file.data)
  
  try {
    const whatsapp = await service.sendWhatsapp(data)
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}


const deleteWhatsapp = async (req, res, next) => {
  const whatsappId = req.params.id
  try {
    const whatsapp = await service.deleteWhatsapp(whatsappId, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

//verificar url 
const verifyWebhook = async (req, res, next) => {
  // let mode = req.query['hub.mode']
  // let challenge = req.query['hub.challenge']
  // let token = req.query['hub.verify_token']

  // console.log('mode', mode)
  // console.log('challenge', challenge)
  // console.log('token', token)

  // if (mode && token) {
  //   if (mode === 'subscribe' && token === accessTok) {
  //     return res.status(200).send(challenge)
  //   } else {
  //     return res.status(403)
  //   }
  // }
}

//evento webhook

const postMenssage = async (req, res, next) => {
  // const message = 'hello world'
  // const caption = 'brochure';
  // const filePath = Path.join(__dirname, '/../../../media/uploads/brochure/cursos.pdf');
  // console.log('fs.createReadStream(filePath)', fs.createReadStream(filePath))
  // const restAPI = whatsAppClient.restAPI(({
  //   idInstance,
  //   apiTokenInstance
  // }))

  // restAPI.message.sendMessage(`51949002838@c.us`, null, message)
  // .then((data) => {
  //     console.log(data)
  // })
  // .catch(e => {
  //     console.error(e)
  // });
  
  // const restAPI = whatsAppClient.restAPI(({
  //     idInstance,
  //     apiTokenInstance
  // }))
  // const data = new FormData();
  // data.append('chatId', `51949002838@c.us`)
  // data.append('caption', 'brochure.pdf')
  // data.append('file', fs.createReadStream(filePath));
  // console.log('data', data)
  // const response = await restAPI.file.sendFileByUpload(data)
  // console.log(`file uploaded ${response.idMessage}`)
}

// axios({
//   method: 'POST',
//   url: 'https://graph.facebook.com/v17.0/' + phoneNoId + '/messages',
//   data: {
//     messaging_product: 'whatsapp',
//     recipient_type: 'individual',
//     to: from,
//     type: 'text',
//     text: {
//       preview_url: false,
//       body: 'jdokqs'
//     }
//   },
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${accessTok}`
//   }
// })

const eventWebhook = async (req, res, next) => {
  // console.log('entro')
  // let bodyParam = req.body

  // console.log(JSON.stringify(bodyParam, null, 2))

  // if (bodyParam.object) {
  //   //mensaje del usuario
  //   if (bodyParam.entry &&
  //     bodyParam.entry[0].changes &&
  //     bodyParam.entry[0].changes[0].value.messages) {
  //     let phoneNoId = bodyParam.entry[0].changes[0].value.metadata.phone_number_id
  //     let from = bodyParam.entry[0].changes[0].value.messages[0].from
  //     let msgBody = bodyParam.entry[0].changes[0].value.messages[0].text.body
  //     let names = bodyParam.entry[0].changes[0].value.contacts[0].profile.name

  //     console.log('names', names)  
  //     console.log('phoneNoId', phoneNoId)
  //     console.log('from', from)
  //     console.log('msgBody', msgBody)

  //     from = from.charAt(0) === '+' ? from.substring(1) : from
  //     const { code, country } = searchCodeNumber(from)
  //     console.log('code', code)
  //     console.log('country', country)
  //     const mobile = from.replace(code, '')
  //     console.log('mobile', mobile)
  //     try {
  //       const assigned = await userDB.detail({ query: { phoneNoId: phoneNoId } })
  //       console.log('assigned', assigned)

  //       try {
  //         console.log('entro user')
  //         const user = await userDB.detail({ query: { mobile: mobile } })
  //         console.log('user', user)
  //         try {
  //           console.log('entro chat')
  //           const chat = await chatDB.detail({ query: { linked: user._id.toString() } })
  //           const chatEdit = await chatDB.update(chat._id.toString(), {
  //             lastMessage: msgBody,
  //             date: new Date()
  //           })

  //           const message = await messageDB.create({
  //             linked: user._id.toString(),
  //             assigned: assigned._id.toString(),
  //             chat: chat._id.toString(),
  //             senderId: bodyParam.entry[0].id,
  //             text: msgBody
  //           })
  //           emitChat(chatEdit)
  //           emitMessage(message)
  //         } catch (error) {
  //           // no existe chat
  //           console.log('errorr chat', error)
  //           console.log('no chat')
  //           const chat = await chatDB.create({
  //             linked: user._id.toString(),
  //             assigned: assigned._id.toString(),
  //             lastMessage: msgBody,
  //             mobile: mobile,
  //             mobileCode: code
  //           })
  //           console.log('chat', chat)
  //           await messageDB.create({
  //             linked: user._id.toString(),
  //             chat: chat._id.toString(),
  //             assigned: assigned._id.toString(),
  //             senderId: bodyParam.entry[0].id,
  //             text: msgBody
  //           })

  //           emitChat(chat)
  //         }

  //       } catch (error) { 
  //         //no existe usuario
  //         console.log('errorr', error)
  //         console.log('no user')
  //         const user = await userDB.create({
  //           mobileCode: code,
  //           mobile: mobile,
  //           names: names,
  //           country: country.name,
  //           email: mobile + '@yopmail.com'
  //         })

  //         const chat = await chatDB.create({
  //           linked: user._id.toString(),
  //           assigned: assigned._id.toString(),
  //           lastMessage: msgBody,
  //           mobile: mobile,
  //           mobileCode: code
  //         })
  //         console.log('chat', chat)

  //         await messageDB.create({
  //           linked: user._id.toString(),
  //           chat: chat._id.toString(),
  //           assigned: assigned._id.toString(),
  //           senderId: bodyParam.entry[0].id,
  //           text: msgBody
  //         })

  //         emitChat(chat)
  //       }
  //     } catch (error) {
  //       console.log('error', error)
  //     }
  //     res.sendStatus(200)
  //   } else {
  //     if (bodyParam.entry &&
  //       bodyParam.entry[0].changes &&
  //       bodyParam.entry[0].changes[0].value.metadata &&
  //       bodyParam.entry[0].changes[0].value.statuses[0] ) { 
  //         const wamid = bodyParam.entry[0].changes[0].value.statuses[0].id
  //         try {
  //           const message = await messageDB.detail({ query: { wamid: wamid } })
  //           const status = bodyParam.entry[0].changes[0].value.statuses[0].status
  //           await messageDB.update(message._id.toString(), {
  //             status: status,
  //             senderId: bodyParam.entry[0].id
  //           })
  //         } catch (error) {
  //           console.log('no existe el mensaje')
  //         }
        
  //       }
  //     res.sendStatus(200)
  //   }
  // }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listWhatsapps,
  createWhatsapp,
  updateWhatsapp,
  detailWhatsapp,
  sendWhatsapp,
  verifyWebhook,
  eventWebhook,
  postMenssage,
  deleteWhatsapp
}
