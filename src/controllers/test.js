'use strict'

const { downloadAudio } = require('utils/functions/audio')
// const { pdfbs64, binarybs64 } = require("utils/functions/pdfbs64")

// const { google } = require('googleapis')
// const docs = require('@googleapis/docs')

// const YOUR_CLIENT_ID = '97121591050-dae0qg3mo4d3v9n4v16qemqm5p0gdj6j.apps.googleusercontent.com'
// const YOUR_CLIENT_SECRET = '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'
// const YOUR_REDIRECT_URL = 'https://developers.google.com/oauthplayground'
// const REFRESH_TOKEN = '1//04sWwOoHiDb2fCgYIARAAGAQSNwF-L9Irr8_Eh_TpXoQnM9j84imF1OR_uDlk4f0HltB7Ltlg-bXFl9Acgter4frSOUwAXG9biO4'

// const oauth2Client = new google.auth.OAuth2(
//   YOUR_CLIENT_ID,
//   YOUR_CLIENT_SECRET,
//   YOUR_REDIRECT_URL
// )
// oauth2Client.setCredentials({refresh_token: REFRESH_TOKEN})

// let googleId = "1hUmoFhU8XvYwOTpEbpC54KVzSNMdQCmn9VGYglPc2Vo"
const { api } = require('utils/functions/zadarma')
const { getDocs, copyDocs, updateDocs, exportPDFFile, createFile, getToken, getCode } = require('utils/functions/google')

const getLessions = async (req, res, next) => {
  try {
    const lessions = await services.getLessions(req.body)
    return lessions
  } catch (error) {
    next(error)
  }
}

const eventGoogleDrive = async (req, res) => {
  
  // const client = await docs.docs({
  //   version: 'v1',
  //   auth: oauth2Client
  // });

  // const drive = await google.drive({
  //   version: 'v3',
  //   auth: oauth2Client
  // })
  
  // const getResponse = await client.documents.get({
  //   documentId: googleId,
  // })

  // var request = await drive.files.copy({
  //   'fileId': googleId,
  //   'resource': getResponse.data.body
  // })
  
  // const updateResponse = await client.documents.batchUpdate({
  //   documentId: request.data.id,
  //   requestBody: {
  //     requests: [
  //       {
  //       replaceAllText: {
  //         containsText: {
  //           text: "{{names}}",
  //           matchCase: true,
  //         },
  //         replaceText: "Julio Grados",
  //       }
  //     }]
  //   }
  // })
  // console.log('updateResponse', updateResponse)

  // const fileId = request.data.id
  // const destPath = path.join(os.tmpdir(), 'important.pdf')
  // const dest = fs.createWriteStream(destPath)

  // const response = await drive.files.export(
  //   {'fileId': googleId, 'mimeType': 'application/pdf'}
  // )

  // const convert = await binarybs64(response.data)
  // console.log('convert', convert)
  
  // res.send(convert)
  const data = await getToken(req.query.code)
  res.send(data)
}

const webhook = async (req, res) => {
  console.log('status', req.body)
  // console.log('res',res)
}

const getMain = async (req, res, next) => {
  // console.log('req', req)
  // // console.log('req.query.zd_echo', req.query.zd_echo)
  // // if (req.query.zd_echo) {res.send(req.query.zd_echo);}
  // // else { res.send("Hi"); }
  // // console.log('req - zadarma', req.body)
  // let balance = await api({
  //   api_method: '/v1/pbx/record/request/',
  //   params: {
  //     call_id: '1678469115.349416',
  //     // pbx_call_id: 'in_987c4adbc78b791f1c23a5160e0efe192d4608bf'
  //   }
  // })
  // const data = balance.data
  // console.log('data', data)
  // // const audio = await downloadAudio(data.links[0])
  // // console.log('audio', audio)
  // // const file = await createFile()
  // // console.log('file', file)
  // res.send(balance.data)
  // console.log('req.query', req.query)
  // const data = await getToken('1//0hQc_MRJN-wjZCgYIARAAGBESNwF-L9IrFsL_0OvUo4K63sj5S0M1k0WTnnYyfLTbWrk4pUyLRkGypcRwi82rFDWS_YqNYXtVbVM')
  // res.send(data)
  const data = await getCode()
  res.send(data)
}

const getBalance = async (req, res, next) => {
  // console.log('holaaa')
  // // let balance = await api({
  // //   http_method: 'POST',
  // //   api_method: '/v1/sms/send/',
  // //   params: {
  // //     number: '+51984480719',
  // //     message: 'Ya no comas huevo en el desayuno, laganas'
  // //   }
  // // })
  // const balance = await api({
  //   api_method: '/v1/webrtc/get_key/',
  //   params: {
  //       sip: '100'
  //       // to: '+51949002838'
  //   }
  // });
  // console.log('balance', balance.data)
  // res.send(balance.data)
}


module.exports = {
  getLessions,
  getMain,
  getBalance,
  eventGoogleDrive,
  webhook
}