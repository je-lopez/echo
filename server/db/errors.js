import r from '../../db/connect'

export function parseQueryError(error) {
  if (!error.name || error.name !== 'ReqlUserError') {
    return error
  }

  const [, message] = error.message.match(/<LGCustomQueryError>(.*)<\/LGCustomQueryError>/)
  return Object.assign({}, error, {message, name: 'LGCustomQueryError'})
}

export function customQueryError(msg) {
  return r.error(`<LGCustomQueryError>${msg}</LGCustomQueryError>`)
}