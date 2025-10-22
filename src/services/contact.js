'use strict'

const { contactDB } = require('db/lib')

const listContacts = async params => {
  const contacts = await contactDB.list(params)
  return contacts
}

const createContact = async (body, loggedContact) => {
  const contact = await contactDB.create(body)
  return contact
}

const updateContact = async (contactId, body, loggedContact) => {
  const contact = await contactDB.update(contactId, body)
  return contact
}

const detailContact = async params => {
  const contact = await contactDB.detail(params)
  return contact
}

const deleteContact = async (contactId, loggedContact) => {
  const contact = await contactDB.remove(contactId)
  return contact
}

const countDocuments = async params => {
  const count = await contactDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listContacts,
  createContact,
  updateContact,
  detailContact,
  deleteContact
}
