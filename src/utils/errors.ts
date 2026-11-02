import status from 'statuses'

/**
 * Thrown when a request to BoxFab API occurs.
 */
export class BoxFabRequestError extends Error {
  constructor(message: any) {
    super(message)
    this.name = 'BoxFabRequestError'
  }
}

type BoxFabResponseError = { code?: number; message?: string }

type BoxFabResponse<TData> =
  | {
      data: TData
      error?: undefined
    }
  | {
      data?: undefined
      error: BoxFabResponseError
    }

function throwBoxFabRequestError(error: BoxFabResponseError, errMsg?: string): never {
  let message: string
  const code = error.code ?? 0
  switch (code) {
    case 400:
      message = 'bad request'
      break
    case 401:
      message = 'unauthorized'
      break
    case 403:
      message = 'forbidden'
      break
    case 404:
      message = 'not found'
      break
    case 500:
      message = 'internal server error'
      break
    default:
      message = status.message[code] || 'unknown error'
      break
  }

  throw new BoxFabRequestError(
    `${errMsg && `${errMsg}: `}[${code}] ${message && `${message}: `}${
      error.message ?? 'no message'
    }`
  )
}

export function handleBoxFabRequestError(
  res: { error: BoxFabResponseError },
  errMsg?: string
): never
export function handleBoxFabRequestError<TData>(
  res: BoxFabResponse<TData>,
  errMsg?: string
): asserts res is { data: TData; error?: undefined }
export function handleBoxFabRequestError(
  res: BoxFabResponse<unknown>,
  errMsg?: string
) {
  if (!res.error) {
    return
  }
  throwBoxFabRequestError(res.error, errMsg)
}
