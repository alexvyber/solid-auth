import { isRedirectResponse, json } from "solid-start";

export function verifyResponse<K>(res: K) {
  if (res instanceof Response) {
    if (isRedirectResponse(res) && res.headers.get("Location")) {
      const url = new URL(res.headers.get("Location") ?? "").href;
      return json(
        {
          redirect: url,
        },
        {
          headers: {
            Location: url,
          },
        }
      );
    }
    return res;
  }
  return json(res);
}
