import fetch from 'isomorphic-fetch'
import config from 'src/config'

export default async function getContactByEmail(email) {
  const url = _crmURL(`/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`)

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    }
  })

  if (!resp.ok) {
    throw new Error(`Couldn't get contact by email: ${resp.statusText}`)
  }

  return resp.json()
}

function _crmURL(path) {
  _assertEnvironment()
  return `${config.server.crm.baseURL}${path}?hapikey=${config.server.crm.key}`
}

function _assertEnvironment() {
  if (!config.server.crm.baseURL) {
    throw new Error('CRM base URL must be configured')
  }
  if (!config.server.crm.key) {
    throw new Error('CRM API key must be configured')
  }
}
