'use strict'

const toSlug = require('slug')
const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment-timezone')
const { downloadFile, saveFileName } = require('utils/files/save')
const { compareOnlySimilarity } = require('utils/functions/text')
const { sqlConsult } = require('utils/functions/sql')
const { calculateProm } = require('utils/functions/enrol')
const { saveCustom, saveFile } = require('utils/files/save')
const { createUser } = require('./user')
const {
  userDB,
  categoryDB,
  courseDB,
  agreementDB,
  progressDB,
  metaDB,
  enrolDB,
  examDB,
  taskDB,
  certificateDB,
  testimonyDB,
  dealDB,
  orderDB, saleDB, voucherDB, receiptDB, tracingDB
} = require('../db')
const { emitDeal, incProspects, addInitialStatus } = require('./deal')
const { createFindQuery, createFindMigration } = require('utils/functions/user')
const { createTimeline } = require('./timeline')
const config = require('config')


const migrateAdminCertificates = async (files, body) => {
  const result = await Promise.all(
    files.map(async (file, index) => {
      const ext = file.name.split('.').pop()
      if (ext === 'jpg' || ext === 'png' || ext === 'jpeg') {
        const filter = file.name.replace('.' + ext, '')
        const part = filter.substring(filter.length, filter.length - 1)
        const code = filter.substring(filter.length - 2, 0)
        console.log('part', part)
        console.log('code', code)
        console.log(file.name)
        try {
          const certificate = await certificateDB.detail({ query: { shortCode: code }, populate: ['linked.ref', 'course.ref'] })
          const route = await saveFileName(file, '/certificates', code + '-' + part + '.' + ext)
          if (part === '1') {
            const updateCertficate = await certificateDB.update(certificate._id, {
              file1: route
            })
            return {
              ...updateCertficate.toJSON(),
              success: true
            }
          } else if (part === '2') {
            const updateCertficate = await certificateDB.update(certificate._id, {
              file2: route
            })
            return {
              ...updateCertficate.toJSON(),
              success: true
            }
          } else {
            return {
              success: false,
              code: 'Parte mal escrita'
            }
          }
        } catch (error) {
          return {
            success: false,
            code: code
          }
        }
      } else {
        return {
          success: false,
          code: 'No es un tipo imagen'
        }        
      }
    })
  )
  return result
}


const validate = (body) => {
  const { mobile, dni, email } = body
  
  if (!dni) {
    delete body.dni
  } else {
    if (dni.length === 2 && (dni.charCodeAt(0) === 39 && dni.charCodeAt(1) === 39) || (dni.charCodeAt(0) === 34 && dni.charCodeAt(1) === 34)) {
      delete body.dni 
    }
  }

  if (!mobile) {
    delete body.mobile
  } else {
    if (mobile.length === 2 && (mobile.charCodeAt(0) === 39 && mobile.charCodeAt(1) === 39) || (mobile.charCodeAt(0) === 34 && mobile.charCodeAt(1) === 34)) {
      delete body.mobile 
    }
  }

  if (!email) {
    delete body.email
  } else {
    if (email.length === 2 && (email.charCodeAt(0) === 39 && email.charCodeAt(1) === 39) || (email.charCodeAt(0) === 34 && email.charCodeAt(1) === 34)) {
      delete body.email 
    }
  }

  return body
}

const validateMobile = (body) => {
  const { Celular1, Celular2 } = body
  
  if (Celular1) {
    if (Celular1.substring(0, 2) === '51') {
      body.Celular1 = Celular1.substring(2,Celular1.length)
    }
  }

  if (Celular2) {
    if (Celular2.substring(0, 2) === '51') {
      body.Celular2 = Celular2.substring(2,Celular2.length)
    }
  }

  return body
}

const propertyUser = (body, lead) => {
  const { Username, Celular1, Nombres, Apellidos, DNI, Email1 } = body
  const { username, mobile, firstName, lastName, dni, email } = lead
  let user = {}
  if (!username && Username) {
    user.username = Username
  }

  if (!mobile && Celular1) {
    user.mobile = Celular1
  }

  if (!firstName && Nombres) {
    user.firstName = Nombres
  }

  if (!lastName && Apellidos) {
    user.lastName = Apellidos
  }

  if (!dni && DNI) {
    user.dni = DNI
  }

  if (!email && Email1) {
    user.email = Email1
  }

  return user
}

const searchCourse = async (courseId) => {
  try {
    const course = await courseDB.detail({
      query: {
        _id: courseId
      }
    })
    return course
  } catch (error) {
    throw error
  }
}

const createOrUpdateUser = async (body, assessors) => {
  let user
  body = validate(body)
  try {
    const params = createFindQuery(body)
    // console.log('params', params.query)
    const lead = await userDB.detail(params)
    // console.log('lead', lead)
    let course = await searchCourse(body.cursos)
    if (course) {
      body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
    }
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    
    if (lead.dni === body.dni) {
      delete body.dni
    }
    body.names = body.firstName + ' ' + body.lastName
    // console.log('body', body)
    user = await userDB.update(lead._id, { ...body })
    // console.log('user', user)
    await createOrUpdateDeal(user.toJSON(), body, assessors)
  } catch (error) {
    if (error.status === 404) {
      // console.log('nuevo lead', body)
      body.names = body.firstName + ' ' + body.lastName
      body.roles = ['Interesado']
      user = await userDB.create(body)
      // courses en body
      let course = await searchCourse(body.courseId)
      if (course) {
        body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
      }
      // console.log('body  nuevo', body)
      createTimeline({
        linked: user,
        type: 'Cuenta',
        name: 'Persona creada'
      })
      await createOrUpdateDeal(user.toJSON(), body, assessors)
    } else {
      throw error
    }
  }
  return user
}

const findDealUser = async user => {
  // agregar el estado de pago de contabilidad 
  try {
    const deal = await dealDB.detail({
      query: {
        client: user._id || user,
        // status: 'Abierto'
      }
    })
    return deal
  } catch (error) {
    return null
  }
}


const createNewDeal = async (user, body, assessors) => {
  console.log('createNewDeal')
  const dataDeal = await addInitialStatus(body)
  const assessor = assessors.find((item) => (body.assessor === item.username))
  const assessorAssigned = {
    username: assessor.username,
    ref: assessor
  }
  dataDeal.assessor = assessorAssigned

  console.log('dataDeal', dataDeal)

  const deal = await dealDB.create({
    ...dataDeal,
    client: user,
    students: [
      {
        student: {...user, ref: user},
        courses: body.courses
      }
    ]
  })
  
  await incProspects(dataDeal)
  emitDeal(deal)
  return deal
}

const createOrUpdateDeal = async (user, body, assessors) => {
  const deal = await findDealUser(user)
  console.log('deal', deal)
  if (deal) {
    if (deal.status === 'Abierto') {
      return deal
    } else if (deal.status === 'Perdido') {
      //actualizar trato a ganado
      return deal
    } else if (deal.status === 'Ganado') {
      if (deal.statusPayment === 'Abierto') {
        return deal
      } else if (deal.statusPayment === 'Pago') {
        return deal
      }
    }
  } else {
    const deal = await createNewDeal(user, body, assessors)
    createTimeline({ linked: user, deal:deal, type: 'Deal', name: 'Nuevo trato creado' })
    return deal
  }
}

const migrateTeachers = async data => {
  const assessors = await userDB.list({ query: { roles: 'Asesor' } })
  
  const promises = data.map(async item => {
    try {
      const user = await createOrUpdateUser({...item}, assessors)
      return user
    } catch (error) {
      // error.teacher = data.username
      console.log('error', error, {...item})
      return error
    }
  })

  const users = await Promise.all(promises)
  return users
}

const createSaleMigration = async (user, assessor, deal, orders, amount, body) => {
  const dateString = body.FechaPago1 // Oct 23
  const dateParts = dateString.split("/")
  const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0])
  const sale = await saleDB.create({
    user: {
      names: user.names ? user.names : '',
      ref: user._id
    },
    assigned: {
      username: assessor.username,
      ref: assessor._id
    },
    amount: amount,
    createdAt: dateObject,
    dateOfSale: dateObject,
    status: 'Finalizada',
    deal: deal,
    orders: orders
  })

  orders.map(async (item, index) => {
    let receipt
    if (index === 0) {
      if (body.Serie1) {
        receipt = await receiptDB.create({
          code: body.Serie1 + '-' + body.Comprobante1,
          serie: body.Serie1,
          sequential: body.Comprobante1,
          amount: item.amount,
          deal: deal,
          sale: sale,
          assigned: {
            username: assessor.username,
            ref: assessor._id
          },
          orders: [item],
          firstName: user.firstName,
          lastName: user.lastName,
          names: user.names ? user.names : '',
          dni: user.dni ? user.dni : '',
          email: user.email ? user.email : '',
          date: item.chargeDate,
          createdAt: item.chargeDate,
          status: 'Finalizada',

        })
      }
    }

    if (index === 1) {
      if (body.Serie2) {
        receipt = await receiptDB.create({
          code: body.Serie2 + '-' + body.Comprobante2,
          serie: body.Serie2,
          sequential: body.Comprobante2,
          amount: item.amount,
          deal: deal,
          sale: sale,
          assigned: {
            username: assessor.username,
            ref: assessor._id
          },
          orders: [item],
          firstName: user.firstName,
          lastName: user.lastName,
          names: user.names ? user.names : '',
          dni: user.dni ? user.dni : '',
          email: user.email ? user.email : '',
          date: item.chargeDate,
          createdAt: item.chargeDate,
          status: 'Finalizada',
          
        })
      }
    }

    if (index === 2) {
      if (body.Serie3) {
        receipt = await receiptDB.create({
          code: body.Serie3 + '-' + body.Comprobante3,
          serie: body.Serie3,
          sequential: body.Comprobante3,
          amount: item.amount,
          deal: deal,
          sale: sale,
          assigned: {
            username: assessor.username,
            ref: assessor._id
          },
          orders: [item],
          firstName: user.firstName,
          lastName: user.lastName,
          names: user.names ? user.names : '',
          dni: user.dni ? user.dni : '',
          email: user.email ? user.email : '',
          date: item.chargeDate,
          createdAt: item.chargeDate,
          status: 'Finalizada',
          
        })
      }
    }
    console.log('receipt', receipt)
    const order = await orderDB.update(item._id, {
      sale: sale._id,
      receipt: {
        code: receipt ? receipt.code : undefined,
        ref: receipt ? receipt._id : undefined
      },
      status: receipt ? 'Cancelada': 'Pagada'
    })
    console.log('order', order)
  })
  return sale
}

const createOrdersSale = async (user, course, body, assessor) => {
  let orders = []
  let amount = 0
  const dateString = body.FechaPago1 // Oct 23
  const dateParts = dateString.split("/")
  const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0])
  if (body.Pago1) {
    let voucher
    const bank = searchBank(body.CuentaPago1)
    if (body.Operacion1) {
      voucher = await voucherDB.create({
        code: body.CuentaPago1 + '-' + body.Operacion1,
        amount: body.Pago1,
        residue: 0,
        isUsed: true,
        date: dateObject,
        createdAt: dateObject,
        operationNumber: body.Operacion1,
        assigned: {
          username: assessor.username,
          ref: assessor._id
        },
        bank: {
          name: bank.name,
          code: bank.code
        },
        image: '/static/img/logo_white.svg'
      })
    }
    console.log('voucher', voucher)
    const order = await orderDB.create({
      assigned: {
        username: assessor.username,
        ref: assessor._id
      },
      quotaNumber: 1,
      amount: body.Pago1,
      chargeDate: dateObject,
      createdAt: dateObject,
      status: voucher ? 'Pagada':'Por Pagar',
      student: {
        names: user.names ? user.names : '',
        email: user.email,
        ref: user._id
      },
      course: {
        name: course.name,
        price: course.price,
        ref: course._id
      },
      name: user.names ? user.names : '',
      dni: user.dni ? user.dni : '',
      voucher: {
        code: voucher ? voucher.code : undefined,
        bank: voucher ? voucher.bank : undefined,
        ref: voucher ? voucher._id : undefined
      }
    })
    amount = amount + order.amount
    orders.push(order)
  }

  if (body.Pago2) {
    let voucher
    const bank = searchBank(body.CuentaPago2)
    const dateString2 = body.FechaPago2 // Oct 23
    const dateParts2 = dateString2.split("/")
    const dateObject2 = new Date(+dateParts2[2], dateParts2[1] - 1, +dateParts2[0])
    if (body.Operacion2) {
      voucher = await voucherDB.create({
        code: body.CuentaPago2 + '-' + body.Operacion2,
        amount: body.Pago2,
        residue: 0,
        isUsed: true,
        date: dateObject2,
        createdAt: dateObject2,
        operationNumber: body.Operacion2,
        assigned: {
          username: assessor.username,
          ref: assessor._id
        },
        bank: {
          name: bank.name,
          code: bank.code
        },
        image: '/static/img/logo_white.svg'
      })
    }
    console.log('voucher', voucher)
    const order = await orderDB.create({
      assigned: {
        username: assessor.username,
        ref: assessor._id
      },
      quotaNumber: 2,
      amount: body.Pago2,
      chargeDate: dateObject,
      createdAt: dateObject,
      status: voucher ? 'Pagada':'Por Pagar',
      student: {
        names: user.names ? user.names : '',
        email: user.email,
        ref: user._id
      },
      course: {
        name: course.name,
        price: course.price,
        ref: course._id
      },
      name: user.names ? user.names : '',
      dni: user.dni ? user.dni : '',
      voucher: {
        code: voucher ? voucher.code : undefined,
        bank: voucher ? voucher.bank : undefined,
        ref: voucher ? voucher._id : undefined
      }
    })
    amount = amount + order.amount
    orders.push(order)
  }

  if (body.Pago3) {
    let voucher
    const bank = searchBank(body.CuentaPago3)
    const dateString3 = body.FechaPago3 // Oct 23
    const dateParts3 = dateString3.split("/")
    const dateObject3 = new Date(+dateParts3[2], dateParts3[1] - 1, +dateParts3[0])
    if (body.Operacion3) {
      voucher = await voucherDB.create({
        code: body.CuentaPago3 + '-' + body.Operacion3,
        amount: body.Pago2,
        residue: 0,
        isUsed: true,
        date: dateObject3,
        createdAt: dateObject3,
        operationNumber: body.Operacion3,
        assigned: {
          username: assessor.username,
          ref: assessor._id
        },
        bank: {
          name: bank.name,
          code: bank.code
        },
        image: '/static/img/logo_white.svg'
      })
    }
    console.log('voucher', voucher)
    const order = await orderDB.create({
      assigned: {
        username: assessor.username,
        ref: assessor._id
      },
      quotaNumber: 1,
      amount: body.Pago3,
      chargeDate: dateObject,
      createdAt: dateObject,
      status: voucher ? 'Pagada':'Por Pagar',
      student: {
        names: user.names ? user.names : '',
        email: user.email,
        ref: user._id
      },
      course: {
        name: course.name,
        price: course.price,
        ref: course._id
      },
      name: user.names ? user.names : '',
      dni: user.dni ? user.dni : '',
      voucher: {
        code: voucher ? voucher.code : undefined,
        bank: voucher ? voucher.bank : undefined,
        ref: voucher ? voucher._id : undefined
      }
    })
    amount = amount + order.amount
    orders.push(order)
  }
  return {orders, amount}
}

const createNewDealSale = async (user, body, assessor) => {
  console.log('createNewDealSale')
  const progress = await progressDB.detail({ query: { key: 'won' } })
  let progressPayment
  if (progress) {
    progressPayment = {
      name: progress.name,
      ref: progress._id
    }
  }

  const deal = await dealDB.create({
    assessor: {
      username: assessor.username,
      ref: assessor._id
    },
    progressPayment,
    statusActivity: 'done',
    status: 'Ganado',
    statusPayment: 'Pago',
    client: user,
    students: [
      {
        student: {...user, ref: user},
        courses: body.courses
      }
    ]
  })
  
  await incProspects(dataDeal)
  emitDeal(deal)
  return deal
}

const createOrUpdateDealSale = async (user, body, assessor) => {
  const deal = await findDealUser(user)
  console.log('deal----', deal)
  console.log('user----', user)
  if (deal) {
    if (deal.status === 'Abierto') {
      return deal
    } else if (deal.status === 'Perdido') {
      //actualizar trato a ganado
      const progress = await progressDB.detail({ query: { key: 'won' } })
      let progressPayment
      if (progress) {
        progressPayment = {
          name: progress.name,
          ref: progress._id
        }
      }

      const updateDeal = await dealDB.updateOne(deal._id, {
        assessor: {
          username: assessor.username,
          ref: assessor._id
        },
        progressPayment,
        statusActivity: 'done',
        status: 'Ganado',
        statusPayment: 'Pago'
      })
      return updateDeal
    } else if (deal.status === 'Ganado') {
      if (deal.statusPayment === 'Abierto') {
        return deal
      } else if (deal.statusPayment === 'Pago') {
        return deal
      }
    }
  } else {
    const deal = await createNewDealSale(user, body, assessor)
    return deal
  }
}

const createOrUpdateUserMigration = async (body) => {
  let user
  const assessor = await userDB.detail({ query: { username: body.Asignado } })
  console.log('assessor', assessor)
  body = validateMobile(body)
  try {
    const params = createFindMigration(body)
    console.log('params', params.query)
    const lead = await userDB.detail(params)
    console.log('lead', lead)
    let course = await searchCourse(body.cursos)
    if (course) {
      body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
    }
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
      if (lead.roles.findIndex(role => role === 'Estudiante') === -1) {
        body.roles = ['Estudiante', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    
    if (lead.dni === body.DNI) {
      delete body.dni
    }
    console.log('body', body)
    user = propertyUser(body, lead.toJSON())
    user = await userDB.update(lead._id, { ...user })
    console.log('user', user)
    const deal = await createOrUpdateDealSale(user.toJSON(), body, assessor.toJSON())
    const { orders, amount } = await createOrdersSale(user.toJSON(), course.toJSON(), body, assessor.toJSON())
    const sale = await createSaleMigration(user.toJSON(), assessor.toJSON(), deal.toJSON(), orders, amount, body)
    console.log('user', user)
    console.log('deal', deal)
    console.log('orders', orders)
    console.log('sale', sale)
    return {user, deal}
  } catch (error) {
    if (error.status === 404) {
      console.log('nuevo lead', body)
      // body.names = body.firstName + ' ' + body.lastName
      body.roles = ['Interesado', 'Estudiante']
      user = await userDB.create({
        username: body.Username,
        names: body.Nombres + ' ' + body.Apellidos,
        email: body.Email1,
        mobile: body.Celular1 ? body.Celular1 : '',
        firstName: body.Nombres,
        lastName: body.Apellidos,
        dni: body.DNI ? body.DNI : '',
        city: body.Region ? body.Region : '',
        roles: body.roles
      })
      
      // courses en body
      let course = await searchCourse(body.cursos)
      if (course) {
        body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
      }
      console.log('body  nuevo', body)
      // createTimeline({
      //   linked: user,
      //   type: 'Cuenta',
      //   name: 'Persona creada'
      // })
      const deal = await createOrUpdateDealSale(user.toJSON(), body, assessor.toJSON())
      const {orders, amount} = await createOrdersSale(user.toJSON(), course.toJSON(), body, assessor.toJSON())
      const sale = await createSaleMigration(user.toJSON(), assessor.toJSON(), deal.toJSON(), orders, amount, body)
      console.log('user', user)
      console.log('deal', deal)
      console.log('orders', orders)
      console.log('sale', sale)
      return {user, deal}
    } else {
      throw error
    }
  }
}

const migrateAdminSales = async data => {
  const result = await Promise.all(
    data.map(async item => {
      try {
        const {user, deal} = await createOrUpdateUserMigration({...item})
        return {
          code: deal._id,
          success: true
        }
      } catch (error) {
        // error.teacher = data.username
        console.log('error', error)
        return {
          code: 'No',
          success: false
        }
      }
    })
  )
  return result
}

const migrateCategories = async data => {
  const categories = await Promise.all(
    data.map(async item => {
      const slug = toSlug(item.name || '', { lower: true })
      try {
        const category = await categoryDB.detail({ query: { slug } })
        return category
      } catch (error) {
        if (error.status === 404) {
          const category = await categoryDB.create({
            ...item,
            slug
          })
          return category
        } else {
          throw error
        }
      }
    })
  )

  return categories
}

const migrateAgrements = async data => {
  const promises = data.map(async item => {
    const slug = toSlug(item.name, { lower: true })
    const image = await downloadFile(
      item.image,
      '/agreements',
      'image-' + slug + '.png'
    )
    const agreementData = {
      ...item,
      institution: item.name,
      image,
      slug
    }
    try {
      const agreement = await agreementDB.create(agreementData)
      return agreement
    } catch (error) {
      error.agreement = data.name
      return error
    }
  })

  const agreements = await Promise.all(promises)
  return agreements
}

const createAdmins = async () => {
  createUser({
    names: 'Carlos Plasencia',
    email: 'carlos@eai.edu.pe',
    mobile: '999999990',
    username: 'CarlosPlasencia',
    password: '123456',
    roles: ['Asesor', 'Docente', 'Administrador']
  })
  createUser({
    names: 'Julio Grados',
    email: 'julio@eai.edu.pe',
    mobile: '999999991',
    username: 'JulioGrados',
    password: '123456',
    roles: ['Asesor', 'Docente', 'Administrador']
  })
  createUser({
    names: 'Juan Pino',
    email: 'juan@eai.edu.pe',
    mobile: '999999992',
    username: 'JuanPino',
    password: '123456',
    roles: ['Asesor', 'Docente', 'Administrador']
  })
  createUser({
    names: 'Asesor',
    email: 'asesor@eai.edu.pe',
    mobile: '999999993',
    username: 'asesor',
    password: '123456',
    roles: ['Asesor']
  })
}

const createProgress = async () => {
  const data = [
    {
      key: 'initial',
      pipes: ['deals'],
      name: 'Prospecto',
      order: 1
    },
    {
      key: 'progress',
      pipes: ['deals'],
      name: 'No Contesto',
      order: 2
    },
    {
      key: 'progress',
      pipes: ['deals'],
      name: 'Si contesto',
      order: 3
    },
    {
      key: 'progress',
      pipes: ['deals'],
      name: 'Confirmar',
      order: 4
    },
    {
      key: 'won',
      pipes: ['accounting'],
      name: 'Nuevo',
      order: 5
    },
    {
      key: 'progress',
      pipes: ['accounting'],
      name: 'Cuenta',
      order: 6
    },
    {
      key: 'progress',
      pipes: ['accounting'],
      name: 'Recibo',
      order: 7
    }
  ]
  data.forEach(progress => {
    progressDB.create(progress)
  })
}

const createTestimonies = async () => {
  const data = [
    {
      firstName: 'Darwin Raúl',
      lastName: 'Huaman Hernandez',
      dni: 70393661,
      city: 'PISCO, ICA',
      rate: 5,
      comment:
        'Es una plataforma que deja muy satisfecho, depende también del ordenador donde desarrolles el curso, pero en general muy bueno eh aprendido muchísimo y me siento mas competente en el ámbito profesional donde me desarrollo.',
      course: {
        name: 'Curso profesional de excel',
        slug: 'excel'
      }
    },
    {
      firstName: 'Jesus Diogenes',
      lastName: 'Coronel Florindez',
      dni: 18144172,
      city: 'LIMA, LIMA',
      rate: 5,
      comment:
        'Muy buena información y casos. Altamente recomendable para quienes desean profundizar en el tema de las finanzas.',
      course: {
        name: 'Curso de Finanzas Corporativas',
        slug: 'finanzas-corporativas'
      }
    },
    {
      firstName: 'Charlie Jaime',
      lastName: 'Tocas Bringas',
      dni: 46846658,
      city: 'LIMA, LIMA',
      rate: 5,
      comment:
        'Este curso me ayudó a comprender mejor como se mueve y funciona el mundo de los recursos humanos y me aportó muchos conceptos que no había visto antes. También me permitió actualizarme al mostrarme las nuevas tendencias de este campo tan interesante e importante para las empresas, como lo es la gestión del talento humano.',
      course: {
        name: 'CURSO DE GESTIÓN DEL TALENTO HUMANO',
        slug: 'gestion-del-talento-humano'
      }
    }
  ]
  data.forEach(testimony => {
    testimonyDB.create(testimony)
  })
}

const createMeta = async () => {
  metaDB.create({
    domain: 'https://www.eai.edu.pe',
    title: 'Escuela Americana de Innovación',
    description:
      'Institución líder en educación de formación continua en el Perú, que brinda cursos de especialización para cada profesional.',
    pages: [
      {
        name: 'Cursos',
        root: '/cursos/[slug]',
        title: '{{name}} - Escuela Americana de Innovación',
        description:
          '✅ Certificado en {{shortName}}  ✅ impreso por {{academicHours}} horas académicas. Metodología 100% virtual. Plana docente de las mejores universidades del Perú.'
      }
    ],
    address: {
      type: 'PostalAddress',
      street: 'Av. José de la Riva Agüero 2092, San Miguel',
      locality: 'Lima',
      postalCode: 15088,
      country: 'PE'
    },
    og: {
      title: 'Escuela Americana de Innovación',
      description:
        'Institución líder en educación de formación continua en el Perú, que brinda cursos de especialización para cada profesional.',
      url: 'https://www.eai.edu.pe/',
      siteName: 'https://www.eai.edu.pe/'
    },
    phone: 997314658,
    themeColor: '#0e61ee'
  })
}

const migrateCourses = async (
  dataCourse,
  dataTeachers,
  dataExtra,
  dataAgreements
) => {
  createAdmins()
  createProgress()
  createMeta()
  createTestimonies()

  const categoriesName = []
  const data = dataCourse.map(element => {
    const extra = dataExtra.find(item => {
      return (
        item.slug.trim() === element.slug.trim() ||
        item.name.trim() === element.name.trim()
      )
    })
    element = {
      ...extra,
      ...element
    }
    if (!extra) {
      console.log('no extra', element.name)
    }
    if (!categoriesName.find(item => item.name === element.category)) {
      if (element.category) {
        categoriesName.push({ name: element.category })
      }
    }

    return element
  })

  console.time('teachers')
  const teachers = await migrateTeachers(dataTeachers)
  console.timeEnd('teachers')
  console.time('agreements')
  const agreements = await migrateAgrements(dataAgreements)
  console.timeEnd('agreements')
  console.time('categories')
  const categories = await migrateCategories(categoriesName)
  console.timeEnd('categories')

  console.time('courses')
  const courses = await Promise.all(
    data.map(async item => {
      let image, shortimage, brochure
      try {
        image = await downloadFile(
          item.image,
          '/courses',
          'image-' + item.slug + '.png'
        )
        image = `/courses/image-${item.slug}.png`
        shortimage = await downloadFile(
          item.shortImage,
          '/courses',
          'shortimage-' + item.slug + '.png'
        )
        shortimage = `/courses/shortimage-${item.slug}.png`
        const id = item.brochureDrive && item.brochureDrive.split('id=')[1]
        const url = `https://drive.google.com/u/0/uc?id=${id}&export=download`
        brochure = `/brochure/brochure-${item.slug}.pdf`
        if (id) {
          brochure = await downloadFile(
            url,
            '/brochure',
            'brochure-' + item.slug + '.pdf'
          )
        }
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        // console.log('error imagen', error)
        return error
      }
      const published = moment(item.published, 'YYYY-MM-DD')
      const categoryItem = categories.find(
        cate => toSlug(cate.name || '') === toSlug(item.category)
      )
      if (!categoryItem) {
        const error = {
          status: 500,
          message: 'No se enconto la categoria',
          course: item.name,
          slug: item.slug
        }
        return error
      }
      const category = {
        ...categoryItem.toJSON(),
        ref: categoryItem._id
      }
      const agreementItem = agreements.find(agree => {
        return (
          agree.institution &&
          toSlug(agree.institution || '') === toSlug(item.agreement || '')
        )
      })
      let agreement
      if (agreementItem) {
        agreement = {
          ...agreementItem.toJSON(),
          ref: agreementItem._id
        }
      }
      const authorItem = teachers.find(
        teacher => teacher.username === item.author
      )

      if (!authorItem) {
        const error = {
          status: 404,
          message: 'No se enconto el author',
          course: item.name,
          slug: item.slug,
          author: item.author
        }
        return error
      }
      const author = {
        ...authorItem.toJSON(),
        names: authorItem.names,
        email: authorItem.email,
        ref: authorItem._id
      }

      const descriptionGeneral = getDescriptionGeneral(item.content)
      const lessons = getModules(item.content)

      const courseData = {
        ...item,
        image,
        shortimage,
        category,
        agreement,
        author,
        published,
        descriptionGeneral,
        lessons,
        brochure,
        teachers: [author]
      }
      try {
        const course = await courseDB.create(courseData)
        console.log('acabe -> ', course.name)
        return course
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        console.log('error curso', error)
        return error
      }
    })
  )
  console.timeEnd('courses')
  return { categories, courses }
}

const getDescriptionGeneral = content => {
  const $ = cheerio.load(content)
  let description = ''
  $('.course-body-about')
    .first()
    .children()
    .filter('p')
    .each((i, element) => {
      const text = $(element).text()
      description += (description && '\n') + text
    })

  return description
}

const getModules = content => {
  const lessons = []
  const $ = cheerio.load(content)
  const about = $('.course-body-about')
  const temary = about['3']
  const resume = $(temary)
    .children()
    .filter('div')

  $(resume['0'])
    .children()
    .each((i, e1) => {
      const eTitle = $(e1).children()['0']
      const title = $(eTitle).text()
      const lesson = {
        name: title,
        slug: toSlug(title, { lower: true }),
        chapters: []
      }
      $(e1)
        .children()
        .each((i2, e2) => {
          if (i2 > 0) {
            const chap = $(e2)
              .children()
              .first()
              .text()
            const chapter = {
              name: chap.trim(),
              slug: toSlug(chap, { lower: true })
            }
            lesson.chapters.push(chapter)
          }
        })

      lessons.push(lesson)
    })

  return lessons
}

const migrateMoodleCourses = async () => {
  const SQL_QUERY = 'SELECT id, fullname FROM mdl_course'

  const courses = await courseDB.list({})
  const dataCourses = await sqlConsult(SQL_QUERY)
  console.log(dataCourses)
  const newCourses = await Promise.all(
    dataCourses.map(async moodleCourse => {
      const course = courses.find(
        item => compareOnlySimilarity(item.name, moodleCourse.fullname) > 0.9
      )
      if (course) {
        const updatecourse = await courseDB.update(course._id, {
          moodleId: moodleCourse.id
        })
        return updatecourse
      } else {
        console.log('no se encontro', moodleCourse.fullname)
        return moodleCourse
      }
    })
  )

  return newCourses
}

const migrateUsersMoodle = async () => {
  const SQL_QUERY =
    'SELECT id, username, firstname, lastname, email, country, city FROM mdl_user WHERE deleted = 0'

  const dataUsers = await sqlConsult(SQL_QUERY)

  const users = await userDB.list({ select: 'email username roles' })

  const newUsers = await Promise.all(
    dataUsers.map(async (moodleUser, idx) => {
      const data = {
        moodleId: moodleUser.id,
        username: moodleUser.username,
        firstName: moodleUser.firstname,
        lastName: moodleUser.lastname,
        names: moodleUser.firstname + ' ' + moodleUser.lastname,
        email: moodleUser.email,
        country: moodleUser.country === 'PE' ? 'Perú' : '',
        city: moodleUser.city,
        role: undefined,
        roles: ['Estudiante']
      }

      const exist = users.find(
        user => user.email === data.email || user.username === data.username
      )

      if (exist) {
        try {
          const updateUser = await userDB.update(exist._id, {
            moodleId: moodleUser.id,
            roles: [...exist.roles, 'Estudiante']
          })
          console.log('update User', updateUser)
          return updateUser
        } catch (error) {
          console.log('error al editar usuario', exist, error)
          return error
        }
      } else {
        try {
          const user = await userDB.create(data)
          return user
        } catch (error) {
          console.log('error al crear usuario', moodleUser)
          return error
        }
      }
    })
  )

  return newUsers
}

const migrateEnrollMoodle = async () => {
  const SQL_QUERY =
    'SELECT ue.id, ue.status, ue.enrolid, ue.userid, ue.timestart, e.courseid, e.status AS state FROM mdl_user_enrolments AS ue INNER JOIN mdl_enrol AS e ON ue.enrolid = e.id'

  const courses = await courseDB.list({
    select: 'moodleId name shortName academicHours price'
  })
  const users = await userDB.list({
    select: 'moodleId firstName lastName'
  })

  const dataEnrolls = await sqlConsult(SQL_QUERY)
  let not = 0
  const newEnrolls = await Promise.all(
    dataEnrolls.map(async (enrol, idx) => {
      const course = courses.find(
        item => parseInt(item.moodleId) === parseInt(enrol.courseid)
      )
      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(enrol.userid)
      )

      if (course && user) {
        const data = {
          ...enrol,
          moodleId: enrol.id,
          linked: {
            ...user.toJSON(),
            ref: user._id
          },
          course: {
            ...course.toJSON(),
            ref: course._id
          },
          date: moment.unix(enrol.timestart).format('YYYY-MM-DD HH:mm')
        }
        try {
          const enrol = await enrolDB.create(data)
          return enrol
        } catch (error) {
          console.log('error', error)
          return error
        }
      } else {
        not++
        if (!course) {
          console.log('not Courseeeeeee', enrol.courseid)
        } else {
          console.log('not user', enrol.userid)
        }
        return enrol
      }
    })
  )

  return newEnrolls
}

const migrateQuizMoodle = async () => {
  const SQL_QUERY = 'SELECT * FROM mdl_quiz'

  const courses = await courseDB.list({
    select: 'moodleId name shortName academicHours price'
  })

  const dataQuiz = await sqlConsult(SQL_QUERY)
  let not = 0

  const dataFilter = dataQuiz.filter(
    (item, index, self) =>
      index ===
      self.findIndex(t => t.course === item.course && t.name === item.name)
  )

  const newExams = await Promise.all(
    dataFilter.map(async (exam, idx) => {
      const course = courses.find(item => item.moodleId === exam.course)
      if (course) {
        const data = {
          moodleId: exam.id,
          name: exam.name,
          number: idx + 1,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
        try {
          const exam = await examDB.create(data)
          return exam
        } catch (error) {
          console.log('error', error)
          return error
        }
      } else {
        not++
        console.log('------------------NO---------------------------')
        console.log('exam', exam)
        console.log('course', course)
        return exam
      }
    })
  )

  console.log('not', not)
  return newExams
}

const migrateTaskMoodle = async () => {
  const SQL_QUERY = 'SELECT * FROM mdl_assign'

  const courses = await courseDB.list({
    select: 'moodleId name shortName academicHours price'
  })

  const dataTask = await sqlConsult(SQL_QUERY)
  let not = 0

  const dataFilter = dataTask.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        t =>
          t.course === item.course &&
          toSlug(t.name, { lower: true }) ===
            toSlug(item.name.trim(), { lower: true })
      )
  )

  const newTasks = await Promise.all(
    dataFilter.map(async (task, idx) => {
      const course = courses.find(item => item.moodleId === task.course)
      if (course) {
        const data = {
          moodleId: task.id,
          name: task.name,
          description: task.intro,
          number: idx + 1,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }

        try {
          const task = await taskDB.create(data)
          return task
        } catch (error) {
          console.log('error', error)
          return error
        }
      } else {
        not++
        console.log('------------------NO---------------------------')
        console.log('task', task)
        console.log('course', course)
        return task
      }
    })
  )

  console.log('not', not)
  return newTasks
}

const migrateEvaluationsMoodle2 = async () => {
  const SQL_QUERY =
    'SELECT qg.quiz, qg.userid, qg.grade AS score, q.course AS courseid FROM mdl_quiz_grades AS qg INNER JOIN mdl_quiz AS q ON qg.quiz = q.id'

  const allExams = await examDB.list({})
  const enrols = await enrolDB.list({})
  const dataQuizUser = await sqlConsult(SQL_QUERY)

  console.log('allExams', allExams.length)
  console.log('enrols', enrols.length)
  console.log('dataQuizUser', dataQuizUser.length)

  let not = 0

  const newEnrols = await Promise.all(
    enrols.map(async enrol => {
      const examsCourse = allExams.filter(exam => {
        return exam.course.moodleId === enrol.course.moodleId
      })

      const dataQuizPerCourseUser = dataQuizUser.filter(item => {
        return (
          item.userid === enrol.linked.moodleId &&
          item.courseid === enrol.course.moodleId
        )
      })

      if (dataQuizPerCourseUser.length === 0) {
        not++
        console.log('course', enrol.course.moodleId)
        console.log('user', enrol.linked.moodleId)
        console.log('-----------------------')
      }

      const exams = examsCourse.map(exam => {
        const result_filter = _.filter(
          dataQuizPerCourseUser,
          item => item.quiz === exam.id
        )
        const result = _.maxBy(result_filter, 'score')
        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.score,
          isTaken: !!result,
          exam: exam._id
        }
        return data
      })

      const updateEnroll = await enrolDB.update(enrol._id, { exams })
      return updateEnroll
    })
  )

  console.log('not', not)

  return newEnrols
}

const migrateEvaluationsMoodle = async () => {
  const courses = await courseDB.list({ select: 'moodleId name' })
  const resps = await Promise.all(
    courses.map(async ({ moodleId, name }, idx) => {
      return new Promise((resolve, reject) => {
        if (moodleId) {
          setTimeout(async () => {
            try {
              const resp = await migrateEvaluationCourse(moodleId, name)
              return resolve(resp)
            } catch (error) {
              return reject(error)
            }
          }, idx * 5 * 1000)
        } else {
          return resolve({ not: 0 })
        }
      })
    })
  )
  let not = 0
  resps.forEach(item => (not += item.not))

  console.log('notAllll', not)

  return resps
}
// /usr/bin/mysqldump -u 'root' -p 'r$!56UFXmrXsM5dS' --databases 'manvicio_ertmdl
// SELECT 'userid', 'username', 'email', 'firstName', 'lastName', 'country', 'city', 'courseid', 'course', 'item', 'score', 'pass', 'time', 'exam' UNION ALL SELECT u.id, u.username, u.email, u.firstname, u.lastname, u.country, u.city, c.id, c.fullname, CASE WHEN gi.itemtype = 'Course' THEN c.fullname + ' Course Total' ELSE gi.itemname END, ROUND(gg.finalgrade, 2), IF(ROUND(gg.finalgrade / gg.rawgrademax * 100, 2) > 79, 'Yes', 'No'), gg.timemodified, gi.iteminstance 
// FROM mdl_course AS c JOIN mdl_context AS ctx ON c.id = ctx.instanceid JOIN mdl_role_assignments AS ra ON ra.contextid = ctx.id JOIN mdl_user AS u ON u.id = ra.userid JOIN mdl_grade_grades AS gg ON gg.userid = u.id JOIN mdl_grade_items AS gi ON gi.id = gg.itemid JOIN mdl_course_categories AS cc ON cc.id = c.category 
// WHERE gi.courseid = c.id AND gi.itemname != 'Attendance' AND gi.courseid = 43 AND c.id = 43 INTO OUTFILE '/tmp/43.csv' 
// FIELDS TERMINATED BY ','
// ENCLOSED BY '"'
// LINES TERMINATED BY '\n';
const migrateEvaluationCourse = async (courseId, name) => {
  const SQL_QUERY = `/usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT 'userid', 'username', 'email', 'firstName', 'lastName', 'country', 'city', 'courseid', 'course', 'item', 'score', 'pass', 'time', 'exam' UNION ALL SELECT u.id, u.username, u.email, u.firstname, u.lastname, u.country, u.city, c.id, c.fullname , CASE WHEN gi.itemtype = 'Course' THEN c.fullname + ' Course Total' ELSE gi.itemname END, ROUND(gg.finalgrade,2), IF (ROUND(gg.finalgrade / gg.rawgrademax * 100 ,2) > 79,'Yes' , 'No'), gg.timemodified, gi.iteminstance FROM mdl_course AS c JOIN mdl_context AS ctx ON c.id = ctx.instanceid JOIN mdl_role_assignments AS ra ON ra.contextid = ctx.id JOIN mdl_user AS u ON u.id = ra.userid JOIN mdl_grade_grades AS gg ON gg.userid = u.id JOIN mdl_grade_items AS gi ON gi.id = gg.itemid JOIN mdl_course_categories AS cc ON cc.id = c.category WHERE gi.courseid = c.id AND gi.itemname != 'Attendance' AND gi.courseid=43 AND c.id=43 ORDER BY 'Username' INTO OUTFILE '/tmp/43.csv' FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n';"`

  const query = {
    'course.moodleId': courseId
  }
  const allExams = await examDB.list({ query })
  const allTasks = await taskDB.list({ query })
  const enrols = await enrolDB.list({ query })
  const dataQuizUser = await sqlConsult(SQL_QUERY)

  console.log(`"********************* ${name} *****************************"`)
  console.log('allExams', allExams.length)
  console.log('enrols', enrols.length)
  console.log('dataQuizUser', dataQuizUser.length)

  let not = 0

  const newEnrols = await Promise.all(
    enrols.map(async enrol => {
      const examsCourse = allExams
      const tasksCourse = allTasks

      const dataQuizPerCourseUser = dataQuizUser.filter(item => {
        return (
          item.userid === enrol.linked.moodleId &&
          item.courseid === enrol.course.moodleId
        )
      })

      if (dataQuizPerCourseUser.length === 0) {
        not++
      }

      const exams = examsCourse.map(exam => {
        const result_filter = _.filter(
          dataQuizPerCourseUser,
          item => item.Item_Name === exam.name
        )
        const result = _.maxBy(result_filter, 'Score')
        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.Score,
          isTaken: !!result,
          exam: exam._id
        }
        return data
      })

      const tasks = tasksCourse.map(task => {
        const result_filter = _.filter(
          dataQuizPerCourseUser,
          item => item.Item_Name === task.name
        )
        const result = _.maxBy(result_filter, 'Score')
        const data = {
          number: task.number,
          name: task.name,
          score: result && result.Score,
          isTaken: !!result,
          task: task._id
        }
        return data
      })

      const exam = calculateProm(exams)
      const task = calculateProm(tasks)
      let dataEnrol = { exams, tasks }
      if (exam.isFinished || task.isFinished) {
        let note = 0
        if (exam.isFinished && task.isFinished) {
          note = (exam.note + task.note) / 2
        } else if (exam.isFinished) {
          note = exam.note
        } else {
          note = task.note
        }
        dataEnrol = {
          exams,
          tasks,
          isFinished: true,
          score: note
        }
      }

      const updateEnroll = await enrolDB.update(enrol._id, dataEnrol)
      return updateEnroll
    })
  )

  return { newEnrols, not }
}
   
const migrateCertificates = async dataCertificate => {
  const enrols = await enrolDB.list({})
  const users = await userDB.list({})
  const courses = await courseDB.list({})
  let not = 0

  // const filteredArr = dataCertificate.reduce((acc, current) => {
  //   const x = acc.find(item => item.code == current.code)
  //   if (!x) {
  //     return acc.concat([current])
  //   } else {
  //     return acc
  //   }
  // }, [])

  function getUnique (arr, comp) {
    // store the comparison  values in array
    const unique = arr
      .map(e => e[comp])

      // store the indexes of the unique objects
      .map((e, i, final) => final.indexOf(e) === i && i)

      // eliminate the false indexes & return unique objects
      .filter(e => arr[e])
      .map(e => arr[e])

    return unique
  }

  const filterArray = getUnique(dataCertificate, 'code')

  const filteredFinal = filterArray.filter(function (obj) {
    return obj.lastName !== 'CAÑAPATANA CASTILLO'
  })

  const resp = filteredFinal.map(async element => {
    // console.log(element)
    const user = users.find(user => {
      const isFirstName =
        compareOnlySimilarity(user.firstName, element.firstName) > 0.9
      const isLastName =
        compareOnlySimilarity(user.lastName, element.lastName) > 0.9

      return isFirstName && isLastName
    })

    if (!user) {
      // not++
      console.log('Not User', element)
      // return
    }

    const course = courses.find(course => {
      let isCourse =
        compareOnlySimilarity(course.shortName, element.course) > 0.8

      if (!isCourse) {
        isCourse =
          element.course.includes(course.shortName) ||
          course.name.includes(element.course)
      }

      return isCourse
    })

    if (!course) {
      // not++

      console.log('Not Course', element)
      // return
    }

    const enrol = enrols.find(enrol => {
      if (course && user) {
        const isCourse = course._id.toString() === enrol.course.ref.toString()
        const isUser = enrol.linked.ref.toString() === user._id.toString()
        return isCourse && isUser
      } else {
        return {}
      }
    })

    // if (!enrol) {
    //   // console.log('Not enrol', element)
    //   // return
    // }

    const data = {
      code: element.code,
      shortCode: element.shortCode,
      linked: {
        firstName: user ? user.firstName : element.firstName,
        lastName: user ? user.lastName : element.lastName,
        ref: user && user._id
      },
      course: {
        shortName: course && course.shortName,
        academicHours: course && course.academicHours,
        ref: course && course._id
      },
      moodleId: course && course.moodleId,
      enrol: enrol && enrol._id,
      score: element.score,
      date: new Date(element.date)
    }
    console.log(data)
    console.log(
      '------------------------------------------------------------------------'
    )
    try {
      const certi = await certificateDB.create(data)

      // if (enrol && enrol.isFinished) {
      //   await enrolDB.update(enrol._id, {
      //     certificate: {
      //       ...certi.toJSON(),
      //       ref: certi._id
      //     }
      //   })
      // }

      return certi
    } catch (error) {
      return error
    }
  })
  return resp
  // const getConvert = field =>
  //   `(CASE WHEN LENGTH(code) > 7 THEN CONVERT(CAST(CONVERT(${field} USING latin1) AS BINARY) USING utf8) ELSE ${field} END) as ${field}s`

  // const SQL_QUERY = `SELECT *, ${getConvert('course')}, ${getConvert(
  //   'firstname'
  // )}, ${getConvert('lastname')} FROM wp_certificate`

  // const enrols = await enrolDB.list({})
  // const users = await userDB.list({})
  // const courses = await courseDB.list({})

  // const dataCertificate = await sqlConsult(SQL_QUERY, 'manvicio_xyzwp')

  // let not = 0

  // const resp = await Promise.all(
  //   dataCertificate.map(async certificate => {
  //     const user = users.find(user => {
  //       const isFirstName =
  //         compareOnlySimilarity(user.firstName, certificate.firstnames) > 0.9
  //       const isLastName =
  //         compareOnlySimilarity(user.lastName, certificate.lastnames) > 0.9

  //       return isFirstName && isLastName
  //     })

  //     if (!user) {
  //       not++
  //       console.log('Not User', certificate)
  //       return
  //     }

  //     const course = courses.find(course => {
  //       let isCourse =
  //         compareOnlySimilarity(course.shortName, certificate.courses) > 0.8

  //       if (!isCourse) {
  //         isCourse =
  //           certificate.courses.includes(course.shortName) ||
  //           course.name.includes(certificate.courses)
  //       }

  //       return isCourse
  //     })

  //     if (!course) {
  //       not++

  //       console.log('Not Course', certificate)
  //       return
  //     }

  //     const enrol = enrols.find(enrol => {
  //       const isCourse = course._id.toString() === enrol.course.ref.toString()
  //       const isUser = enrol.linked.ref.toString() === user._id.toString()

  //       return isCourse && isUser
  //     })

  //     if (!enrol) {
  //       return
  //     }

  //     const data = {
  //       code: certificate.code,
  //       shortCode: certificate.codeshort,
  //       linked: {
  //         firstName: user.firstName,
  //         lastName: user.lastName,
  //         ref: user._id
  //       },
  //       course: {
  //         shortName: course.shortName,
  //         academicHours: certificate.hours,
  //         ref: course._id
  //       },
  //       moodleId: certificate.id,
  //       enrol: enrol && enrol._id,
  //       score: certificate.score,
  //       date: Date(certificate.date)
  //     }

  //     try {
  //       const certi = await certificateDB.create(data)

  //       if (enrol && enrol.isFinished) {
  //         await enrolDB.update(enrol._id, {
  //           certificate: {
  //             ...certi.toJSON(),
  //             ref: certi._id
  //           }
  //         })
  //       }

  //       return certi
  //     } catch (error) {
  //       return error
  //     }
  //   })
  // )

  // console.log('not', not)

  // return resp
}

const searchBank = (code) => {
  const options = [
    {
      label: 'Pago Efectivo',
      name: 'Pago Efectivo',
      code: 'PEF'
    },
    {
      label: 'Interbank',
      name: 'Interbank',
      code: 'INT'
    },
    {
      label: 'Interbank Ahorros',
      name: 'Interbank Ahorros',
      code: 'ITA'
    },
    {
      label: 'Yape',
      name: 'Yape',
      code: 'YAP'
    },
    {
      label: 'Plin',
      name: 'Plin',
      code: 'PLI'
    },
    {
      label: 'BCP',
      name: 'BCP',
      code: 'BCP'
    },
    {
      label: 'BBVA',
      name: 'BBVA',
      code: 'BBVA'
    },
    {
      label: 'Banco de la Nación',
      name: 'Banco de la Nación',
      code: 'BN'
    },
    {
      label: 'Banco de la Nación Ahorros',
      name: 'Banco de la Nación Ahorros',
      code: 'BNA'
    },
    {
      label: 'Scotiabank',
      name: 'Scotiabank',
      code: 'SCK'
    },
    {
      label: 'Paypal',
      name: 'Paypal',
      code: 'PP'
    },
    {
      label: 'Lukita',
      name: 'Lukita',
      code: 'LUK'
    },
    {
      label: 'Pago Link',
      name: 'Pago Link',
      code: 'PAG'
    }
  ]
  const bank = options.find(option => option.code === code)
  return bank
}

const orderCourseEvaluations = async (arr) => {
  const filterArr = arr.filter(item => (item.item.includes('Evaluación') || item.item.includes('Evaluacion')))
  let transformedArr = filterArr.map(function (obj) {
    const result = {
      userid: obj.userid,
      username: obj.username,
      email: obj.email,
      firstName: obj.firstName,
      lastName: obj.lastName,
      country: obj.country,
      city: obj.city,
      courseid: obj.courseid,
      course: obj.course,
      califications: []
    }

    for (let userid in obj) {
      if (obj.hasOwnProperty(userid) && userid !== "userid") {
          result.califications.push({ [userid]: obj[userid] });
      }
    }

    result.califications = [Object.assign({}, ...result.califications)]
    return result;
  });
  // console.log('transformedArr', transformedArr)
  const newArr = new Map(transformedArr.map(({ userid, username, email, firstName, lastName, country, city, courseid, course, califications }) => [userid, { userid, username, email, firstName, lastName, country, city, courseid, course, califications: [] }]));
  // console.log('newArr', newArr)
  for (let { userid, califications } of transformedArr) {
      newArr.get(userid).califications.push(...[califications].flat())
  };

  return [...newArr.values()]
}

// chmod +x
// 40 23 * * * /usr/bin/rsync -a /var/lib/lxc/moodle-pro/rootfs/var/backups/moodle/enrol.json /var/lib/lxc/pro-apps/rootfs/var/www/apps/api/backup/

const migrationCourseEvaluations = async (arr, moodleId) => {
  let course, examns, tasks; 
  try {
    course = await courseDB.detail({query: {moodleId: moodleId}})
  } catch (error) {
    throw error
  }
  if (course.typeOfEvaluation === 'exams') {
    try {
      examns = await examDB.list({
        query: { 'course.ref': course._id.toString() },
        sort: 'number'
      })
    } catch (error) {
      throw error
    }
  } else if (course.typeOfEvaluation === 'tasks') {
    try {
      tasks = await taskDB.list({
        query: { 'course.ref': course._id.toString() },
        sort: 'number'
      })
    } catch (error) {
      throw error
    }
  } else if (course.typeOfEvaluation === 'both') {
    try {
      examns = await examDB.list({
        query: { 'course.ref': course._id.toString() },
        sort: 'number'
      })
    } catch (error) {
      throw error
    }

    try {
      tasks = await taskDB.list({
        query: { 'course.ref': course._id.toString() },
        sort: 'number'
      })
    } catch (error) {
      throw error
    }
  }
  console.log('arr', arr.length)
  const enrolsCalifications = arr.map(async element => {
    let updateCreateUser, enrol, dataEnrol;
    try {
      const user = await userDB.detail({ query: { $or: [{ moodleId: parseInt(element.userid) }, { email: element.email }, { username: element.username }] } })
      // console.log('user', user)
      if (user.roles && user.roles.indexOf('Estudiante') > -1) {
        updateCreateUser = await userDB.update(user._id, {
          moodleId: parseInt(element.userid),
          email: element.email,
          username: user.username ? user.username : element.username
        })
      } else {
        updateCreateUser = await userDB.update(user._id, {
          moodleId: parseInt(element.userid),
          email: element.email,
          username: user.username ? user.username : element.username,
          roles: [...user.roles, 'Estudiante']
        })
      }
    } catch (error) {
      console.log('error', error)
      const data = {
        moodleId: parseInt(element.userid),
        username: element.username,
        firstName: element.firstname,
        lastName: element.lastname,
        names: element.firstname + ' ' + element.lastname,
        email: element.email,
        country: element.country === 'PE' ? 'Perú' : '',
        city: element.city ? element.city : '',
        roles: ['Estudiante']
      }
      updateCreateUser = await userDB.create(data)
    }
    // console.log('element', element)
    // console.log('updateCreateUser', updateCreateUser)
    try {
      enrol = await enrolDB.detail({query: { 'linked.ref': updateCreateUser._id.toString(), 'course.ref': course._id.toString() }})
    } catch (error) {
      console.log('no existe enrol')
    }

    if (course.typeOfEvaluation === 'exams') {
      const califications = examns.map(exam => {
        const arrayCalifications = element.califications
        const result = arrayCalifications.find(
          item => parseInt(item.exam) === parseInt(exam.moodleId)
        )
        const  score = result ? result.score === '\\N' ? null : parseInt(result.score) : null
        const data = {
          number: exam.number,
          name: exam.name,
          score: score,
          date: result && result.time === '\\N' ? null : result.time,
          isTaken: score >= 11 ? true : false,
          exam: exam._id
        }
        return data
      })
      const examEnd = calculateProm(califications)
      // console.log('course.numberEvaluation', course.numberEvaluation)
      // console.log('califications.length', califications.length)
      // console.log('califications.name', course.name)
      if (course.numberEvaluation !== califications.length) {
        examEnd.isFinished = false
      }

      if (examEnd.isFinished) {
        dataEnrol = {
          linked: { ...updateCreateUser.toJSON(), ref: updateCreateUser._id },
          exams: califications,
          isFinished: true,
          score: examEnd.note,
          finalScore: examEnd.note,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
      } else {
        dataEnrol = {
          linked: { ...updateCreateUser.toJSON(), ref: updateCreateUser._id },
          exams: califications,
          isFinished: false,
          score: examEnd.note,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
      }
    } else if (course.typeOfEvaluation === 'tasks') {
      const califications = tasks.map(task => {
        const arrayCalifications = element.califications
        const result = arrayCalifications.find(
          item => parseInt(item.exam) === parseInt(task.moodleId)
        )
        // console.log('result task', result)
        const  score = result ? result.score === '\\N' ? null : parseInt(result.score) : null
        const data = {
          number: task.number,
          name: task.name,
          score: score,
          date: result && result.time === '\\N' ? null : result.time,
          isTaken: score >= 11 ? true : false,
          task: task._id
        }
        return data
      })

      const taskEnd = calculateProm(califications)

      if (course.numberEvaluation !== califications.length) {
        taskEnd.isFinished = false
      }

      if (taskEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          tasks: califications,
          isFinished: true,
          score: taskEnd.note,
          finalScore: taskEnd.note,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
      } else {
        dataEnrol = {
          linked: { ...updateCreateUser.toJSON(), ref: updateCreateUser._id },
          tasks: califications,
          isFinished: false,
          score: taskEnd.note,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
      }
    } else if (course.typeOfEvaluation === 'both') {
      const examnsCalifications = examns.map(exam => {
        const arrayCalifications = element.califications
        const result = arrayCalifications.find(
          item => parseInt(item.exam) === parseInt(exam.moodleId)
        )
        const  score = result ? result.score === '\\N' ? null : parseInt(result.score) : null
        const data = {
          number: exam.number,
          name: exam.name,
          score: score,
          date: result && result.time === '\\N' ? null : result.time,
          isTaken: score >= 11 ? true : false,
          exam: exam._id
        }
        return data
      })

      const tasksCalifications = tasks.map(task => {
        const arrayCalifications = element.califications
        const result = arrayCalifications.find(
          item => parseInt(item.exam) === parseInt(task.moodleId)
        )
        const  score = result ? result.score === '\\N' ? null : parseInt(result.score) : null
        const data = {
          number: task.number,
          name: task.name,
          score: score,
          date: result && result.time === '\\N' ? null : result.time,
          isTaken: score >= 11 ? true : false,
          task: task._id
        }
        return data
      })

      const bothEnd = calculatePromBoth(examnsCalifications, tasksCalifications)

      if (course.numberEvaluation !== examnsCalifications.length + tasksCalifications.length) {
        bothEnd.isFinished = false
      }

      if (bothEnd.isFinished) {
        dataEnrol = {
          linked: { ...updateCreateUser.toJSON(), ref: updateCreateUser._id },
          exams: examnsCalifications,
          tasks: tasksCalifications,
          isFinished: true,
          score: bothEnd.note,
          finalScore: bothEnd.note,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
      } else {
        dataEnrol = {
          linked: { ...updateCreateUser.toJSON(), ref: updateCreateUser._id },
          exams: examnsCalifications,
          tasks: tasksCalifications,
          isFinished: false,
          score: bothEnd.note,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
      }
    }

    if (course.typeOfEvaluation === 'exams' && dataEnrol.score !== enrol.score) {
      const tracing = await tracingDB.create({
        user: updateCreateUser._id,
        course: course._id,
        enrol: enrol._id,
        status: 'endModule',
        examLast: enrol.exams,
        examPresent: dataEnrol.exams
      })
    } else if (course.typeOfEvaluation === 'tasks' && dataEnrol.score !== enrol.score) {
      const tracing = await tracingDB.create({
        user: updateCreateUser._id,
        course: course._id,
        enrol: enrol._id,
        status: 'endModule',
        taskLast: enrol.task,
        taskPresent: dataEnrol.task
      })
    } else if (course.typeOfEvaluation === 'both' && dataEnrol.score !== enrol.score) {
      const tracing = await tracingDB.create({
        user: updateCreateUser._id,
        course: course._id,
        enrol: enrol._id,
        status: 'endModule',
        examLast: enrol.exams,
        examPresent: dataEnrol.exams,
        taskLast: enrol.task,
        taskPresent: dataEnrol.task
      })
    }
    if (dataEnrol.score === 0) {
      const dateOne = new Date()
      const dateTwo = new Date(enrol.createdAt)
      const dateSub = (dateOne.getTime() - dateTwo.getTime())
      const days = Math.round(dateSub / 86400000)
      if (days === 7) {
        const tracing = await tracingDB.create({
          user: updateCreateUser._id,
          course: course._id,
          enrol: enrol._id,
          status: 'timingWeek'
        })
      }

      if (days === 30) {
        const tracing = await tracingDB.create({
          user: updateCreateUser._id,
          course: course._id,
          enrol: enrol._id,
          status: 'timingMonth'
        })
      }
    }
    // console.log('course', course.name)
    
    if (enrol) {
      try {
        const updateEnroll = await enrolDB.update(enrol._id, dataEnrol)
        // console.log('Se actualizó enrol:', updateEnroll)
        return updateEnroll
      } catch (error) {
        // console.log('Error al actualizar enrol:', error)
        throw {
          type: 'Actualizar enrol',
          message: `No actualizó el enrol con examenes ${enrol._id}`,
          metadata: enrol,
          error: error
        }
      }
    } else {
      try {
        const enrol = await enrolDB.create(dataEnrol)
        // console.log('Se creó un nuevo enrol', enrol)
        return enrol
      } catch (error) {
        // console.log('error al crear un nuevo enrol', error)
        throw {
          type: 'Crear enrol',
          message: `No creó el enrol con examenes`,
          metadata: data,
          error: error
        }
      }
    }
  })

  const results = await Promise.all(enrolsCalifications.map(p => p.catch(e => e)))
  const validEnrols = results.filter(result => !result.error)
  const errorEnrols = results.filter(result => result.error)

  return { validEnrols }
}

module.exports = {
  migrateTeachers,
  migrateCourses,
  migrateCategories,
  migrateMoodleCourses,
  migrateUsersMoodle,
  migrateEnrollMoodle,
  migrateEvaluationsMoodle,
  migrateAdminCertificates,
  migrateAdminSales,
  migrateQuizMoodle,
  migrateTaskMoodle,
  migrateCertificates,
  orderCourseEvaluations,
  migrationCourseEvaluations
}



