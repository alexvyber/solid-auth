import { isRedirectResponse, json } from 'solid-start'
import { eToString } from '../utils'
import { verifyResponse } from './verifyResponse'

export const withApiHandler = async <R, F extends () => R>(action: F) => {
  try {
    const res = await action()
    return verifyResponse(res)
  } catch (e) {
    if (e instanceof Response) {
      if (isRedirectResponse(e) && e.headers.get('Location')) {
        const url = new URL(e.headers.get('Location') ?? '').href
        return json({
          redirect: url,
        })
      }
      return e
    } else {
      return json({ error: eToString(e) }, { status: 500 })
    }
  }
}
