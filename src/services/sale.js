'use strict'

const CustomError = require('custom-error-instance')
const { saleDB, voucherDB, receiptDB, dealDB, progressDB, userDB, orderDB } = require('db/lib')
const { sumAmountOrders, existOrders } = require('utils/functions/sale')
const { saveFile } = require('utils/files/save')
const { emitDeal, emitAccounting } = require('./deal')

/* Basicos */
const listSales = async params => {
  console.log('--------------------------------------------------------')
  console.log('SALES')
  console.log('--------------------------------------------------------')
  const sales = await saleDB.list(params)
  return sales
}

const searchSales = async params => {
  const deals = await saleDB.search(params)
  return deals
}

const assessorSales = async params => {
  console.log('--------------------------------------------------------')
  console.log('SALES ASSESSOR')
  console.log('--------------------------------------------------------')
  const sales = await saleDB.list(params)
  console.log('sales', sales)
  return sales
}

const createSale = async (body, loggedUser) => {
  body.orders = existOrders(body.orders)
  body.orders = prepareOrders(body)
  body.status = getStatusSale(body.orders, body.amount)
  const sale = await saleDB.create(body)
  body.orders.map(async item => {
    const order = await orderDB.update(item._id, {
      sale: sale._id
    })
    console.log('order', order)
  })
  return sale
}

const resetSale = async (body, loggedUser) => {
  try {
    body.orders = existOrders(body.orders)
    body.orders.map(async order => {
      const voucher = order.voucher && order.voucher.ref
      if (voucher) {
        const voucherDetail = await voucherDB.detail({ query: { _id: voucher._id } })
        const residue = voucherDetail.residue + order.amount

        const voucherUpdate = await voucherDB.update(voucher._id, {
          residue: residue
        })
        console.log(voucherUpdate)
      }
      const orderRemove = await orderDB.remove(order._id)
      console.log(orderRemove)
    })
    return {success: true}
  } catch (error) {
    throw error
  }
}

const updateSale = async (saleId, body) => {
  console.log('entrooo 2')
  if (body.status === 'Pendiente' || body.status === 'Pagando' || body.status === 'Finalizada') {
    body.orders = existOrders(body.orders)
    body.orders = prepareOrders(body)
    body.status = getStatusSale(body.orders, body.amount)
    const sale = await saleDB.update(saleId, body)
    body.orders.map(async item => {
      const order = await orderDB.update(item._id, {
        sale: sale._id
      })
      console.log('order', order)
    })
    return sale
  } else {
    const InvalidError = CustomError('CastError', { message: 'La venta ya no se puede editar.', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  }
}

const updateSaleOne = async (saleId, body, loggedUser) => {
  if (body.status === 'Pendiente' || body.status === 'Pagando' || body.status === 'Finalizada') {
    body.orders = existOrders(body.orders)
    body.orders = prepareOrders(body)
    body.status = getStatusSale(body.orders, body.amount)
    const sale = await saleDB.updateAdmin(saleId, body)
    console.log('sale', sale)
    body.orders.map(async item => {
      const order = await orderDB.update(item._id, {
        sale: sale._id
      })
      console.log('order', order)
    })
    return sale
  } else {
    const InvalidError = CustomError('CastError', { message: 'La venta ya no se puede editar.', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  }
}

const updateSaleAdmin = async (saleId, body, loggedUser) => {
  const sale = await saleDB.updateAdmin(saleId, {
    annular: true
  })
  body.orders.map(async item => {
    const order = await orderDB.update(item._id, {
      annular: true
    })
    const voucher = order.voucher && order.voucher.ref
    if (voucher) {
      const voucherUpdate = await voucherDB.update(voucher._id, {
        annular: true
      })
      console.log('voucherUpdate', voucherUpdate)
    }
    console.log('order', order)
  })
  return sale
}

const detailSale = async params => {
  const sale = await saleDB.detail(params)
  return sale
}

const deleteSale = async (saleId, loggedUser) => {
  const sale = await saleDB.detail({ query: { _id: saleId } })
  await saleDB.remove(saleId)
  return sale
}

const countDocuments = async params => {
  const count = await saleDB.count(params)
  return count
}

/* functions */

const editVoucher = async (orders, dataOrders) => {
  try {
    const newOrders = await Promise.all(
      orders.map(async order => {
        const data = dataOrders.find(
          data => data.quotaNumber === order.quotaNumber
        )
        if (data && data.status === 'Por Pagar' && data.voucher) {
          const amount = order.amount
          const voucherAmount = order.voucher.ref.residue
          const { residue, isUsed } = getResidueVoucher(voucherAmount, amount)
          const updateVoucher = await voucherDB.update(order.voucher.ref._id, {
            residue,
            isUsed
          })

          order.voucher.ref = updateVoucher
        }
        return order
      })
    )
    return newOrders
  } catch (error) {
    if (error.status && error.message) {
      throw error
    } else {
      const InvalidError = CustomError('MongoError', { message: 'error al gurdar las ordenes', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
    }
  }
}

const prepareOrders = ({ orders, amount }) => {
  const sum = sumAmountOrders(orders)
  console.log('orders', orders)
  console.log('sum', sum)
  console.log('amount', amount)
  if (sum !== amount) {
    const InvalidError = CustomError('CastError', { message: 'La suma de montos de las ordenes debe coincidir con el monto de la venta', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  } else {
    const results = orders.map(order => {
      return order._id && { ...order }
    })
    return results
  }
}

const prepareOrdersOne = async ({ orders, amount, user }, files) => {
  const sum = sumAmountOrders(orders)
  console.log('orders', orders)
  if (sum !== amount) {
    const InvalidError = CustomError('CastError', { message: 'La suma de montos de las ordenes debe coincidir con el monto de la venta', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  }

  let results
  try {
    // console.log('order length', orders.length)
    results = await Promise.all(
      orders.map(async order => {
        const orderRes = await changeOrderOne(order, user, files)
        return orderRes
      })
    )
  } catch (error) {
    throw error
  }

  return results
}

const changeOrder = async (order, linked, files) => {
  try {
    if (order.voucher) {
      order.status = 'Pagada'
      order.paymentDate = Date()
      const voucher = await findOrAddVoucher(
        order.voucher,
        order.amount,
        order.assigned,
        files
      )
      order.voucher.code = voucher.code
      order.voucher.ref = voucher
      if (order.receipt) {
        const { _id, isBill, ruc, dni, name, businessName, serie, sequential } = order.receipt
        const code = (serie && sequential) ? serie + '-' + sequential : null
        const data = code ? { isBill, ruc, dni, name, businessName, serie, sequential, code, _id } :  { isBill, ruc, dni, name, businessName, _id }
        const receipt = await findOrAddReceipt(data, files, order.assigned, linked)
        order.receipt.code = receipt.code
        order.receipt.ref = receipt
      }
    }
    return order
  } catch (error) {
    if (error.status && error.message) {
      throw error
    } else {
      const InvalidError = CustomError('MongoError', { message: 'error al guardar la orden', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
    }
  }
}

const changeOrderOne = async (order, linked, files) => {
  try {
    if (order.voucher) {
      order.status = 'Pagada'
      order.paymentDate = Date()
      const voucher = await findOrAddVoucher(
        order.voucher,
        order.amount,
        order.assigned,
        files
      )
      order.voucher.code = voucher.code
      order.voucher.ref = voucher
      console.log('files', files)
      if (order.receipt) {
        const { _id, isBill, ruc, dni, name, businessName, code } = order.receipt.ref
        const data = { isBill, ruc, dni, name, businessName, code, _id }
        data.code ? data.code : delete data.code
        const receipt = await findOrAddReceipt(data, files, order.assigned, linked)
        order.receipt.code = receipt.code
        order.receipt.ref = receipt
      }
    }
    return order
  } catch (error) {
    if (error.status && error.message) {
      throw error
    } else {
      const InvalidError = CustomError('MongoError', { message: 'error al guardar la orden', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
    }
  }
}

const findVoucher = async (voucher) => {
  try {
    const dbVoucher = await voucherDB.detail({ query: { code: voucher.code } })
    
    return dbVoucher
  } catch (error) {
    throw error
  }
}

const findOrAddVoucher = async (voucher, orderAmount, assigned, files) => {
  try {
    if (voucher._id) {
      console.log('con id voucher')
      getResidueVoucher(voucher.amount, orderAmount)
      if (files) {
        const file = files[voucher.code]
        if (file) {
          const route = await saveFile(file, '/vouchers')
          voucher.image = route
        }
      }
      const updateVoucher = await voucherDB.update( voucher._id, {
        ...voucher,
        bank: voucher.bank && {
          ...voucher.bank,
          name: voucher.bank.label
        },
        assigned,
        residue: voucher.amount,
        isUsed: true
      })
      return updateVoucher
    } else if (voucher.ref && voucher.ref._id) { 
      console.log('con id ref voucher')
      getResidueVoucher(voucher.amount, orderAmount)
      if (files) {
        const file = files[voucher.ref.code]
        if (file) {
          const route = await saveFile(file, '/vouchers')
          voucher.ref.image = route
        }
      }
      const updateVoucher = await voucherDB.update( voucher.ref._id, {
        ...voucher,
        bank: voucher.ref.bank && {
          ...voucher.ref.bank,
          name: voucher.ref.bank.label
        },
        assigned,
        residue: voucher.ref.amount,
        isUsed: true
      })
      return updateVoucher
    }else {
      console.log('no existe voucher')
      getResidueVoucher(voucher.amount, orderAmount)
      if (files) {
        const file = files[voucher.code]
        if (file) {
          const route = await saveFile(file, '/vouchers')
          voucher.image = route
        }
      }
      const data = {
        ...voucher,
        bank: voucher.bank && {
          ...voucher.bank,
          name: voucher.bank.label
        },
        code: voucher.code,
        assigned,
        residue: voucher.amount,
        isUsed: false
      }
      const newVoucher = await voucherDB.create(data)
      console.log('new voocher', newVoucher)
      return newVoucher
    }
  } catch (error) {
    throw error
  }
}

const getResidueVoucher = (voucherAmount, orderAmount) => {
  const residue = parseFloat(voucherAmount) - parseFloat(orderAmount)
  let isUsed = false
  if (residue < 0) {
    const InvalidError = CustomError('CastError', { message: 'El monto de la orden debe ser menor o igual al monto del voucher', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  } else if (residue === 0) {
    isUsed = true
  }
  return { isUsed, residue }
}

const findOrAddReceipt = async (receipt, files, assigned, linked) => {
  try {
    if (receipt._id || receipt.ref) {
      receipt.status = 'Procesado'
      const ref = receipt._id ? receipt._id : receipt.ref
      if (files) {
        const file = files[receipt.code]
        if (file) {
          const route = await saveFile(file, '/receipts')
          receipt.file = route
        }
      }
      const updateReceipt = await receiptDB.update(ref, {
        ...receipt,
        assigned,
        linked
      })
      console.log('updateReceipt', updateReceipt)
      return updateReceipt
    } else {
      delete receipt.code
      receipt.status = 'Procesado'
      if (files) {
        const file = files[receipt.code]
        if (file) {
          const route = await saveFile(file, '/receipts')
          receipt.file = route
        }
      }
      const newReceipt = await receiptDB.create({
        ...receipt,
        assigned,
        linked
      })
      console.log('newReceipt', newReceipt)
      return newReceipt
    }
  } catch (error) {
    throw error
  }
}

const getStatusSale = (orders, amount) => {
  let sum = 0
  orders.forEach(item => {
    if (item.status === 'Pagada' || item.status === 'Usada' || item.status === 'Cancelada') {
      sum += parseFloat(item.amount)
    }
  })
  console.log('orders', orders)
  console.log('amount', amount)
  console.log('sum', sum)
  if (sum === amount) {
    return 'Finalizada'
  } else if (sum === 0) {
    return 'Pendiente'
  } else {
    return 'Pagando'
  }
}

const changeStatusUser = async sale => {
  if (sale.status === 'Pagando' || sale.status === 'Finalizada') {
    const progress = await progressDB.detail({ query: { key: 'won' } })
    let progressPayment
    if (progress) {
      progressPayment = {
        name: progress.name,
        ref: progress._id
      }
    }

    if (sale.user && sale.user.ref) {
      const user = await userDB.detail({ query: { _id: sale.user.ref } })

      if (user) {
        await userDB.update(user._id, {
          roles: [...user.roles, 'Cliente']
        })
      }
    }
    const statusActivity = 'done'
    const status = 'Ganado'
    const statusPayment = 'Abierto'
    const updateDeal = await dealDB.update(sale.deal, {
      progressPayment,
      statusActivity,
      status,
      statusPayment
    })

    const treasurer = await userDB.detail({query: { roles: 'Tesorero' }})
    emitDeal(updateDeal)
    emitAccounting(updateDeal, treasurer)
  }
}

module.exports = {
  countDocuments,
  listSales,
  searchSales,
  assessorSales,
  createSale,
  resetSale,
  updateSale,
  updateSaleOne,
  updateSaleAdmin,
  detailSale,
  deleteSale,
  prepareOrders,
  getStatusSale
}
