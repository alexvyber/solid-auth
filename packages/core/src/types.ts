/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Authenticator } from './authenticator'

export type IAction = 'login' | 'logout'
export type WithProvider<T extends IAction> = T extends 'login'
  ? {
      provider: string
      type: T
      opts: Parameters<Authenticator['authenticate']>[2]
    }
  : {
      type: T
      opts: Parameters<Authenticator['logout']>[1]
    }

export interface Session {
  /**
   * A unique identifier for this session.
   *
   * Note: This will be the empty string for newly created sessions and
   * sessions that are not backed by a database (i.e. cookie-based sessions).
   */
  readonly id: string

  /**
   * The raw data contained in this session.
   *
   * This is useful mostly for SessionStorage internally to access the raw
   * session data to persist.
   */
  readonly data: SessionData

  /**
   * Returns `true` if the session has a value for the given `name`, `false`
   * otherwise.
   */
  has(name: string): boolean

  /**
   * Returns the value for the given `name` in this session.
   */
  get(name: string): any

  /**
   * Sets a value in the session for the given `name`.
   */
  set(name: string, value: any): void

  /**
   * Sets a value in the session that is only valid until the next `get()`.
   * This can be useful for temporary values, like error messages.
   */
  flash(name: string, value: any): void

  /**
   * Removes a value from the session.
   */
  unset(name: string): void
}

export interface SessionData {
  [name: string]: any
}

export class AuthorizationError extends Error {
  constructor(message?: string, public cause?: Error) {
    super(message)
  }
}
