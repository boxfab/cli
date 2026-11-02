import { describe, expect, test } from 'vitest'

import { handleBoxFabRequestError, BoxFabRequestError } from '../../src/utils/errors'

describe('handleBoxFabRequestError', () => {
  test('does not throw when there is no error', () => {
    const res = { data: { id: '123' } }
    expect(() => handleBoxFabRequestError(res)).not.toThrow()
  })

  test('throws BoxFabRequestError for known status codes', () => {
    const res = { error: { code: 401, message: 'invalid token' } }
    expect(() => handleBoxFabRequestError(res, 'Auth failed')).toThrow(
      BoxFabRequestError
    )
    expect(() => handleBoxFabRequestError(res, 'Auth failed')).toThrow(
      'Auth failed: [401] unauthorized: invalid token'
    )
  })

  test('throws BoxFabRequestError with message for status code 0', () => {
    const res = { error: { code: 0, message: 'connection reset' } }
    expect(() => handleBoxFabRequestError(res, 'Request failed')).toThrow(
      BoxFabRequestError
    )
    expect(() => handleBoxFabRequestError(res, 'Request failed')).toThrow(
      'Request failed: [0] unknown error: connection reset'
    )
  })

  test('throws BoxFabRequestError when error code is missing', () => {
    const res = { error: { message: 'something went wrong' } } as any
    expect(() => handleBoxFabRequestError(res, 'Request failed')).toThrow(
      BoxFabRequestError
    )
    expect(() => handleBoxFabRequestError(res, 'Request failed')).toThrow(
      'Request failed: [0] unknown error: something went wrong'
    )
  })

  test('handles valid but unlisted HTTP status codes via statuses package', () => {
    const res = { error: { code: 502, message: 'upstream down' } }
    expect(() => handleBoxFabRequestError(res)).toThrow(BoxFabRequestError)
    expect(() => handleBoxFabRequestError(res)).toThrow(
      '[502] Bad Gateway: upstream down'
    )
  })
})
