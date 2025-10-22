const moment = require('moment-timezone')

const genRandon = () => {
  return Math.floor(Math.random() * 99999 + 10000)
}

//Base Info

const base = {
  user: {
    names: 'Super Test de mover',
    ref: '5e4db6cc055384601b8c2aee'
  },
  assigned: {
    username: 'carlos',
    ref: '5e445b64521fa94843238403'
  },
  currency: 'pen'
}

const baseCourse = {
  status: 'Interesado',
  asked: '2020-02-19T22:29:32.527Z',
  name: 'Curso de Gestión Pública',
  published: '2019-01-21T05:00:00.000Z',
  ref: '5e445b80521fa948432384c4'
}

const baseOrder = number => ({
  quotaNumber: number,
  chargeDate: moment('2020-02-28')
    .add(number - 1, 'months')
    .format('YYYY-MM-DD'),
  assigned: { username: 'carlos', ref: '5e445b64521fa94843238403' }
})

const baseVoucher = {
  date: '2020-02-28',
  bank: 'BCP',
  operationNumber: '12345',
  paymentOrder: 'nose que es',
  note: 'holaaa xd'
}

const receipt1 = { isBill: false, name: 'Bill 1', dni: 2345644 }
const receipt2 = { isBill: true, businessName: 'Bill 1', ruc: 23456493944 }

/**************************** Create Sale *********************************/

// caso 1: Crea una venta con un pago unico

const case1 = {
  ...base,
  amount: 190,
  courses: [
    {
      ...baseCourse,
      price: 190
    }
  ],
  orders: [
    {
      ...baseOrder(1),
      amount: 190,
      status: 'Por Pagar',
      voucher: {
        ...baseVoucher,
        amount: 190,
        code: genRandon()
      },
      receipt: receipt1
    }
  ]
}

// pago dividido en dos quotas
const case2 = {
  ...base,
  amount: 300,
  courses: [
    {
      ...baseCourse,
      price: 150
    },
    {
      ...baseCourse,
      price: 150
    }
  ],
  orders: [
    {
      ...baseOrder(1),
      amount: 200,
      status: 'Por Pagar',
      voucher: {
        ...baseVoucher,
        amount: 200,
        code: genRandon()
      },
      receipt: receipt2
    },
    {
      ...baseOrder(2),
      amount: 100,
      status: 'Por Pagar'
    }
  ]
}

// Paga un voucher por dos usuarios
const voucher = {
  ...baseVoucher,
  amount: 380,
  code: genRandon()
}
const caseBase = JSON.parse(JSON.stringify(case1))
const case3 = [
  {
    ...caseBase,
    orders: [
      {
        ...baseOrder(1),
        amount: 190,
        status: 'Por Pagar',
        voucher,
        receipt: receipt1
      }
    ]
  },
  {
    ...caseBase,
    orders: [
      {
        ...baseOrder(2),
        amount: 190,
        status: 'Por Pagar',
        voucher,
        receipt: receipt2
      }
    ]
  }
]

// paga segunda cuota y completa la venta
const case4 = {
  sale: JSON.parse(JSON.stringify(case2)),
  voucher: {
    ...baseVoucher,
    amount: 100,
    code: genRandon()
  },
  receipt: receipt1
}

// paga segunda cuota y deja una tercera
const case5 = {
  sale: JSON.parse(JSON.stringify(case2)),
  voucher: {
    ...baseVoucher,
    amount: 80,
    code: genRandon()
  },
  receipt: receipt1,
  order: {
    ...baseOrder(3),
    amount: 20,
    status: 'Por Pagar'
  }
}

// Pago de 2 usuarios, pero de uno dividido en dos cuotas

const case6 = {
  sale1: JSON.parse(JSON.stringify(case1)),
  sale2: JSON.parse(JSON.stringify(case2)),
  voucher: {
    ...baseVoucher,
    amount: 390,
    code: genRandon()
  }
}

module.exports = {
  case1,
  case2,
  case3,
  case4,
  case5,
  case6
}
