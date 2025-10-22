'use strict'

const { createSale, updateSale } = require('../../../services/sale')

const { sumPriceCourses, sumAmountOrders } = require('utils/functions/sale')

const { case1, case2, case3, case4, case5, case6 } = require('./data')

const dbModule = require('db')
const config = require('config')

const { db } = dbModule(config.db)

const saleValidate = sale => {
  expect(sale).toHaveProperty('user.ref')
  expect(sale).toHaveProperty('assigned.ref')
  expect(sale.amount).toBeGreaterThan(0)
  expect(sale.amount).toEqual(sumPriceCourses(sale.courses))
  expect(sale.amount).toEqual(sumAmountOrders(sale.orders))
  expect(sale).toHaveProperty('currency', 'pen')
  expect(sale).toHaveProperty('dateOfSale')
}

const orderValidate = order => {
  expect(order).toHaveProperty('assigned.ref')
  expect(order.amount).toBeGreaterThan(0)
  expect(order.chargeDate).not.toEqual(undefined)
  if (order.status === 'Pagada') {
    expect(order).toHaveProperty('receipt.ref')
    expect(order).toHaveProperty('voucher.ref')
    expect(order.paymentDate).not.toEqual(undefined)
  } else if (order.status === 'Por Pagar') {
    expect(order.voucher).toHaveProperty('ref', undefined)
    expect(order.receipt).toHaveProperty('ref', undefined)
    expect(order).toHaveProperty('paymentDate', undefined)
  }
  if (order.voucher.code) {
    expect(order.status).toBe('Pagada')
  } else {
    expect(order.status).toBe('Por Pagar')
  }
}

const voucherValidate = (voucher, order) => {
  if (order.status === 'Pagada') {
    expect(voucher.amount).toBeGreaterThan(voucher.residue)
    if (voucher.isUsed === true) {
      expect(voucher.residue).toEqual(0)
    } else {
      expect(voucher.residue).toBeGreaterThan(0)
    }
    if (voucher.residue === 0) {
      expect(voucher.isUsed).toEqual(true)
    } else {
      expect(voucher.isUsed).toEqual(false)
    }
  }
}

const receiptValidate = receipt => {
  if (receipt.isBill === false) {
    expect(receipt.name).not.toEqual(undefined)
    expect(receipt.dni).not.toEqual(undefined)
  } else {
    expect(receipt.ruc).not.toEqual(undefined)
    expect(receipt.businessName).not.toEqual(undefined)
  }
}

beforeEach(async () => {
  await db.connect()
})

afterEach(async () => {
  await db.close()
})

test('Case 1', async () => {
  const sale = await createSale(case1)

  //sale
  saleValidate(sale)
  expect(sale.amount).toEqual(sumAmountOrders(sale.orders, 'Pagada'))
  expect(sale.status).toBe('Finalizada')

  const order = sale.orders[0]

  //order 1
  orderValidate(order)
  expect(order.quotaNumber).toBe(1)
  expect(order.amount).toEqual(sumPriceCourses(sale.courses))
  expect(order.status).toBe('Pagada')

  //voucher
  const voucher = order.voucher.ref
  voucherValidate(voucher, order)
  expect(voucher.amount).toEqual(sale.amount)

  //receipt
  const receipt = order.receipt.ref
  receiptValidate(receipt)
})

test('Case 2', async () => {
  const sale = await createSale(case2)
  //sale
  saleValidate(sale)
  expect(sale.amount).not.toEqual(sumAmountOrders(sale.orders, 'Pagada'))
  expect(sale.status).toBe('Pagando')

  //order 1
  const order1 = sale.orders[0]
  orderValidate(order1)
  expect(order1.quotaNumber).toBe(1)
  expect(order1.amount).not.toEqual(sumPriceCourses(sale.courses))
  expect(order1.status).toBe('Pagada')

  //voucher
  const voucher = order1.voucher.ref
  voucherValidate(voucher, order1)
  expect(voucher.amount).not.toEqual(sale.amount)

  //receipt
  const receipt = order1.receipt.ref
  receiptValidate(receipt)

  //order 2
  const order2 = sale.orders[1]
  orderValidate(order2)
  expect(order2.quotaNumber).toBe(2)
  expect(order2.amount).not.toEqual(sumPriceCourses(sale.courses))
  expect(order2.status).toBe('Por Pagar')
})

test('Case 3', async () => {
  const sale1 = await createSale(case3[0])
  //sale1
  saleValidate(sale1)
  expect(sale1.amount).toEqual(sumAmountOrders(sale1.orders, 'Pagada'))
  expect(sale1.status).toBe('Finalizada')

  const order1 = sale1.orders[0]

  //order1 1
  orderValidate(order1)
  expect(order1.quotaNumber).toBe(1)
  expect(order1.amount).toEqual(sumPriceCourses(sale1.courses))
  expect(order1.status).toBe('Pagada')

  //voucher1
  const voucher1 = order1.voucher.ref
  voucherValidate(voucher1, order1)
  expect(voucher1.amount).not.toEqual(sale1.amount)

  //receipt1
  const receipt1 = order1.receipt.ref
  receiptValidate(receipt1)

  const sale2 = await createSale(case3[1])

  //sale2
  saleValidate(sale2)
  expect(sale2.amount).toEqual(sumAmountOrders(sale2.orders, 'Pagada'))
  expect(sale2.status).toBe('Finalizada')

  const order2 = sale2.orders[0]

  //order2 1
  orderValidate(order2)
  expect(order2.quotaNumber).toBe(2)
  expect(order2.amount).toEqual(sumPriceCourses(sale2.courses))
  expect(order2.status).toBe('Pagada')
  //voucher2
  const voucher2 = order2.voucher.ref
  voucherValidate(voucher2, order2)
  expect(voucher2.amount).not.toEqual(sale2.amount)

  //receipt2
  const receipt2 = order2.receipt.ref
  receiptValidate(receipt2)
})

test('Case 4', async () => {
  const sale = await createSale(case4.sale)
  //sale
  saleValidate(sale)
  expect(sale.amount).not.toEqual(sumAmountOrders(sale.orders, 'Pagada'))
  expect(sale.status).toBe('Pagando')

  //order 1
  const order1 = sale.orders[0]
  orderValidate(order1)
  expect(order1.quotaNumber).toBe(1)
  expect(order1.amount).not.toEqual(sumPriceCourses(sale.courses))
  expect(order1.status).toBe('Pagada')

  //voucher
  const voucher = order1.voucher.ref
  voucherValidate(voucher, order1)
  expect(voucher.amount).not.toEqual(sale.amount)

  //receipt
  const receipt = order1.receipt.ref
  receiptValidate(receipt)

  //order 2
  const order2 = sale.orders[1]
  orderValidate(order2)
  expect(order2.quotaNumber).toBe(2)
  expect(order2.amount).not.toEqual(sumPriceCourses(sale.courses))
  expect(order2.status).toBe('Por Pagar')

  //payment order 2
  const saleData = Object.assign({}, sale.toJSON())
  saleData.orders[1].voucher = case4.voucher
  saleData.orders[1].receipt = case4.receipt

  const sale2 = await updateSale(sale._id, saleData)

  //sale
  saleValidate(sale2)
  expect(sale2.amount).toEqual(sumAmountOrders(sale2.orders, 'Pagada'))
  expect(sale2.status).toBe('Finalizada')

  //order 1
  const order21 = sale2.orders[0]
  orderValidate(order21)
  expect(order21.quotaNumber).toBe(1)
  expect(order21.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order21.status).toBe('Pagada')

  //voucher
  const voucher21 = order21.voucher
  expect(voucher21.code).not.toEqual(undefined)
  expect(voucher21.ref).not.toEqual(undefined)

  //order 2
  const order22 = sale2.orders[1]
  orderValidate(order22)
  expect(order22.quotaNumber).toBe(2)
  expect(order22.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order22.status).toBe('Pagada')

  //voucher
  const voucher22 = order22.voucher.ref
  voucherValidate(voucher22, order22)
  expect(voucher22.amount).not.toEqual(sale2.amount)

  //receipt
  const receipt22 = order22.receipt.ref
  receiptValidate(receipt22)
})

test('Case 5', async () => {
  const sale = await createSale(case5.sale)
  //sale
  saleValidate(sale)
  expect(sale.amount).not.toEqual(sumAmountOrders(sale.orders, 'Pagada'))
  expect(sale.status).toBe('Pagando')

  //order 1
  const order1 = sale.orders[0]
  orderValidate(order1)
  expect(order1.quotaNumber).toBe(1)
  expect(order1.amount).not.toEqual(sumPriceCourses(sale.courses))
  expect(order1.status).toBe('Pagada')

  //voucher
  const voucher = order1.voucher.ref
  voucherValidate(voucher, order1)
  expect(voucher.amount).not.toEqual(sale.amount)

  //receipt
  const receipt = order1.receipt.ref
  receiptValidate(receipt)

  //order 2
  const order2 = sale.orders[1]
  orderValidate(order2)
  expect(order2.quotaNumber).toBe(2)
  expect(order2.amount).not.toEqual(sumPriceCourses(sale.courses))
  expect(order2.status).toBe('Por Pagar')

  //payment order 2
  const saleData = Object.assign({}, sale.toJSON())
  saleData.orders[1].voucher = case5.voucher
  saleData.orders[1].receipt = case5.receipt
  saleData.orders[1].amount = 80
  saleData.orders.push(case5.order)

  const sale2 = await updateSale(sale._id, saleData)

  //sale
  saleValidate(sale2)
  expect(sale2.amount).not.toEqual(sumAmountOrders(sale2.orders, 'Pagada'))
  expect(sale2.status).toBe('Pagando')

  //order 1
  const order21 = sale2.orders[0]
  orderValidate(order21)
  expect(order21.quotaNumber).toBe(1)
  expect(order21.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order21.status).toBe('Pagada')

  //voucher
  const voucher21 = order21.voucher
  expect(voucher21.code).not.toEqual(undefined)
  expect(voucher21.ref).not.toEqual(undefined)

  //order 2
  const order22 = sale2.orders[1]
  orderValidate(order22)
  expect(order22.quotaNumber).toBe(2)
  expect(order22.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order22.status).toBe('Pagada')

  //voucher
  const voucher22 = order22.voucher.ref
  voucherValidate(voucher22, order22)
  expect(voucher22.amount).not.toEqual(sale2.amount)

  //receipt
  const receipt22 = order22.receipt.ref
  receiptValidate(receipt22)

  //order 3
  const order23 = sale2.orders[2]
  orderValidate(order23)
  expect(order23.quotaNumber).toBe(3)
  expect(order23.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order23.status).toBe('Por Pagar')
})

test('Case 6', async () => {
  const saleData1 = case6.sale1
  saleData1.orders[0].voucher = case6.voucher
  const sale = await createSale(saleData1)
  //sale
  saleValidate(sale)
  expect(sale.amount).toEqual(sumAmountOrders(sale.orders, 'Pagada'))
  expect(sale.status).toBe('Finalizada')

  const order = sale.orders[0]

  //order 1
  orderValidate(order)
  expect(order.quotaNumber).toBe(1)
  expect(order.amount).toEqual(sumPriceCourses(sale.courses))
  expect(order.status).toBe('Pagada')

  //voucher
  const voucher = order.voucher.ref
  voucherValidate(voucher, order)
  expect(voucher.amount).not.toEqual(sale.amount)

  //receipt
  const receipt = order.receipt.ref
  receiptValidate(receipt)

  const saleData2 = case6.sale2
  saleData2.orders[0].voucher = case6.voucher
  const sale2 = await createSale(saleData2)
  //sale2
  saleValidate(sale2)
  expect(sale2.amount).not.toEqual(sumAmountOrders(sale2.orders, 'Pagada'))
  expect(sale2.status).toBe('Pagando')

  //order 1
  const order21 = sale2.orders[0]
  orderValidate(order21)
  expect(order21.quotaNumber).toBe(1)
  expect(order21.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order21.status).toBe('Pagada')

  //voucher2
  const voucher2 = order21.voucher.ref
  voucherValidate(voucher2, order21)
  expect(voucher2.amount).not.toEqual(sale2.amount)

  //receipt
  const receipt2 = order21.receipt.ref
  receiptValidate(receipt2)

  //order 2
  const order22 = sale2.orders[1]
  orderValidate(order22)
  expect(order22.quotaNumber).toBe(2)
  expect(order22.amount).not.toEqual(sumPriceCourses(sale2.courses))
  expect(order22.status).toBe('Por Pagar')
})
