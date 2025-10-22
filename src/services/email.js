'use strict'
const CustomError = require('custom-error-instance')

const { emailDB, dealDB, userDB } = require('db/lib')
const { sendEmail, sendCrm, sendEmailOnly, sendMailTemplate } = require('utils/lib/sendgrid')
const { createTimeline } = require('./timeline')
const { getSocket } = require('../lib/io')
const { getBase64 } = require('utils/functions/base64')

const listEmails = async params => {
  console.log('--------------------------------------------------------')
  console.log('EMAILS')
  console.log('--------------------------------------------------------')
  const emails = await emailDB.list(params)
  return emails
}

const createSendEmail = async (body, loggedUser) => {
  const dataEmail = prepareEmail(body)
  dataEmail.subject = body.subject ? body.subject : body.preheader
  const email = await emailDB.create(dataEmail)
  await sendEmailSengrid(email)
  if (email) {
    emitEmail(email)
  }
  return email
}

const emitDeal = deal => {
  if (deal.assessor) {
    const io = getSocket()
    io.to(deal.assessor.ref).emit('deal', deal)
  }
}

const createEmailOnly = async (body, loggedUser) => {
  const email = await emailDB.create(body)
  return email
}

const createEmail = async (body, loggedUser) => {
  const dataEmail = prepareEmail(body)
  const email = await emailDB.create(dataEmail)
  if (email.template && email.template.ref) {
    sendEmailSengrid(email)
  }else {
    emitEmail(email)
  }
  return email
}

const sendMassiveEmail = async data => { 
  const result = await Promise.all(
    data.map(async item => {
      // console.log('item', item)
      const substitutions = {
        firstName: item.firstName,
        lastName: item.lastName,
        course: item.course,
        courier: item.courier,
        dateSend: item.dateSend,
        tracking: item.tracking,
        numberTracking: item.numberTracking,
        address: item.address,
        dateMax: item.dateMax 
      }
      const to = item.email
      const from = 'cursos@eai.edu.pe'
      const fromname = 'Escuela Americana de Innovación'
      const templateId = 'd-50196211445c4818a174189e5b6c498b'
      const preheader = `🚚 Envío de certificado y constancia de notas - ${item.lastName}, ${item.firstName} - ${item.course}`
      const subject = `🚚 Envío de certificado y constancia de notas - ${item.lastName}, ${item.firstName} - ${item.course}`
      try {
        
        const user = await userDB.detail({ query: { email: item.email } })
        console.log('user', user)
        const deal = await dealDB.detail({ query: { client: user._id.toString() } })
        console.log('deal', deal)

        if (user && deal) { 
          const linked = {
            names: user.names,
            _id: user._id
          }
          const assigned = {
            username: deal.assessor && deal.assessor.username,
            ref: deal.assessor && deal.assessor.ref,
          }
          console.log('linked', linked)
          const email = await createEmail({
            linked,
            to,
            subject,
            assigned,
            from,
            fromname,
            preheader,
            deal: deal._id
          })
          console.log('email try', email)
          await sendMailTemplate({
            to,
            from,
            fromname,
            substitutions,
            templateId: templateId,
            args: {
              emailId: email._id
            }
          })
        } else {
          const email = await createEmailOnly({
            to,
            subject,
            from,
            fromname,
            preheader
          })
          console.log('email else', email)
          await sendMailTemplate({
            to,
            from,
            fromname,
            substitutions,
            templateId: templateId,
            args: {
              emailId: email._id
            }
          })
        }
        return {
          email: item.email,
          success: true
        }
      } catch (error) {
        console.log('error', error)
        if (error && error.status === 404 && (error.message === 'El usuario que intenta buscar no existe.' || error.message === 'El deal no se encontro')) { 
          try {
            console.log('entroo', to, from, fromname)
            const email = await createEmailOnly({
              to,
              subject,
              from,
              fromname,
              preheader
            })
            console.log('email', email)
            await sendMailTemplate({
              to,
              from,
              fromname,
              substitutions,
              templateId: templateId,
              args: {
                emailId: email._id
              }
            })
            return {
              email: item.email,
              success: true
            }
          } catch (err) {
            console.log('error 2', err)
            return {
              email: item.email,
              success: false
            }
          }
        } else {
          return {
            email: item.email,
            success: false
          }
        }
      }
    })
  )
  return result
}

const searchEmails = async params => {
  const emails = await emailDB.search(params)
  return emails
}

const resendEmail = async (body, loggedUser) => {
  if (body._id) {
    delete body._id
    delete body.date
    delete body.updatedAt
    delete body.createdAt
    delete body.success
    delete body.status
  }
  const email = await emailDB.create(body)
  if (body.attachments && body.attachments.length) {
    const attachments = await Promise.all(
      body.attachments.map(async (attachment) => {
        const base64 = await getBase64(attachment.url)
        return {
          filename: attachment.filename,
          content: base64,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      })
    )
    body.attachments = attachments
  }
  body.html = body.content
  await sendEmailOnly(body)
  return email
}

const createEmailLinked = async (body, loggedUser) => {
  const email = await emailDB.create(body)
  await createTimeline({
    deal: body.deal,
    assigned: body.assigned,
    type: 'Email',
    name: `Se envió email`
  })
  return email
}

const updateEmail = async (emailId, body, loggedUser) => {
  const email = await emailDB.update(emailId, body)
  return email
}

const detailEmail = async params => {
  const email = await emailDB.detail(params)
  return email
}

const deleteEmail = async (emailId, loggedEmail) => {
  const email = await emailDB.remove(emailId)
  return email
}

const countDocuments = async params => {
  const count = await emailDB.count(params)
  return count
}

/* functions */

const prepareEmail = ({ template, ...data }) => {
  const { linked, assigned } = template || data
  // console.log('template', template)
  // console.log('data', data)
  // console.log('linked', linked)
  // console.log('linked names', linked.names)
  // console.log('assigned', assigned)
  const dataEmail = {
    ...data,
    linked: {
      names: linked.names,
      ref: linked._id
    },
    assigned: {
      username: assigned.username,
      ref: assigned._id ? assigned._id : assigned.ref ? assigned.ref._id : assigned.ref
    },
    template: template && {
      name: template.name,
      ref: template._id
    }
  }
  // console.log('dataEmail', dataEmail)
  return dataEmail
}

const prepareEmailLinked = ({ template, ...data }) => {
  const { assigned } = template || data
  // console.log('template', template)
  // console.log('data', data)
  // console.log('linked', linked)
  // console.log('linked names', linked.names)
  // console.log('assigned', assigned)
  const dataEmail = {
    ...data,
    assigned: {
      username: assigned.username,
      ref: assigned._id ? assigned._id : assigned.ref ? assigned.ref._id : assigned.ref
    },
    template: template && {
      name: template.name,
      ref: template._id
    }
  }
  // console.log('dataEmail', dataEmail)
  return dataEmail
}

const sendEmailSengrid = async ({ to, from, subject, preheader, content, _id }) => {
  const userEmail = {
    to,
    from,
    subject: subject ? subject : preheader,
    preheader: preheader,
    html: content,
    args: {
      emailId: _id
    }
  }
  console.log('userEmail', userEmail)
  return await sendCrm(userEmail)
}

const updateEmailTimeline = async (emailId, status, time) => {
  const email = await emailDB.detail({query: { _id: emailId }})

  if (email === null) {
    const InvalidError = CustomError('CastError', { message: 'El email que intentas editar no existe.', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  }
  console.log('email deal', email)
  try {
    const timeline = createTimeline({
      linked: email.linked,
      deal: email.deal,
      assigned: email.assigned,
      type: 'Email',
      note: status,
      name: `[${status}] - ${email.preheader}`,
    })
    return timeline
  } catch (errorDB) {
    const error = parseErrorDB(errorDB)
    throw error
  }
}

const updateStatusEmail = async ({ emailId, event }) => {
  const email = await emailDB.detail({
    query: { _id: emailId },
    select: 'status'
  })
  console.log('email edit', email)
  const status = getNewStatus(event)
  if (email.status !== status) {
    const updateEmail = await emailDB.update(email._id, { status })
    const timeline = await updateEmailTimeline(email._id, status, event.timestamp)
    // emitEmail(updateEmail)
  }
}

const getNewStatus = event => {
  switch (event) {
    case 'delivered':
      return 'Entregado'
    case 'open':
      return 'Abierto'
    case 'click':
      return 'Click'
    case 'spamreport':
      return 'Spam'
    case 'bounce':
      return 'Rechazado'
    default:
      return event
  }
}

const emitEmail = email => {
  console.log('email.asigned', email.assigned)
  if (email.assigned) {
    const io = getSocket()
    io.to(email.assigned.ref).emit('email', email)
  }
}

module.exports = {
  countDocuments,
  listEmails,
  createEmail,
  resendEmail,
  searchEmails,
  sendMassiveEmail,
  createEmailOnly,
  createEmailLinked,
  updateEmail,
  detailEmail,
  deleteEmail,
  updateStatusEmail,
  createSendEmail
}
