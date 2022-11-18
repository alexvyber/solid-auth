import { json, type APIEvent } from "solid-start";
import { Authenticator } from "./authenticator";
import { ISocialProvider } from "./providers";
import { withApiHandler } from "./utils/withAPIHandler";

export const createSolidAuthHandler = <User>(
  authenticator: Authenticator<User>
) => {
  return async (event: APIEvent) => {
    const params = new URL(event.request.url).searchParams;
    const opts = JSON.parse(params.get("opts") ?? "{}");
    if (event.request.method === "POST") {
      const type = params.get("type");
      switch (type) {
        case "login": {
          return await withApiHandler(async () => {
            const provider = params.get("provider");
            if (!provider) {
              throw new Error("No provider specified");
            }
            return await authenticator.authenticate(
              provider,
              event.request,
              opts
            );
          });
        }
        case "logout": {
          if (!("redirectTo" in opts)) {
            throw new Error("redirectTo is required");
          }
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await authenticator.logout(event.request, opts as any);
          } catch (e) {
            return json({ error: eToString(e) });
          }
        }
      }
    } else if (event.request.method === "GET") {
      const url = new URL(event.request.url);
      if (!url.pathname.endsWith("/callback")) {
        throw new Error("No callback specified");
      }
      const callbackIdx = url.pathname.lastIndexOf("/callback");
      const provider = url.pathname.slice(1, callbackIdx).split("/").pop();
      if (!provider) {
        throw new Error("No provider specified");
      }
      return await authenticator.authenticate(provider, event.request, {
        successRedirect: "/",
      });
    }
  };
};

export const createSolidAuthClient = (authURL: string) => {
  const wrapper = withHandler(authURL);
  type IOpts = Parameters<Authenticator["authenticate"]>[2];
  return {
    logout: async (opts: Parameters<Authenticator["logout"]>[1]) =>
      await wrapper({
        type: "logout",
        opts,
      }),
    login: async <K extends ISocialProvider>(
      provider: K,
      opts: K extends "discord"
        ? Omit<IOpts, "successRedirect" | "failureRedirect"> & {
            successRedirect: string;
            failureRedirect: string;
          }
        : IOpts
    ) =>
      await wrapper({
        type: "login",
        provider,
        opts,
      }),
  };
};

type IAction = "login" | "logout";
type WithProvider<T extends IAction> = T extends "login"
  ? {
      provider: ISocialProvider;
      type: T;
      opts: Parameters<Authenticator["authenticate"]>[2];
    }
  : {
      type: T;
      opts: Parameters<Authenticator["logout"]>[1];
    };
const withHandler =
  (authURL: string) =>
  async <T extends IAction>(body: WithProvider<T>) => {
    const res = await fetch(
      `${authURL}?type=${body.type}&opts=${JSON.stringify(body.opts)}${
        body.type === "login" ? `&provider=${body.provider}` : ""
      }`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    const json = await res.json();
    if ("redirect" in json) {
      return (window.location.href = json.redirect);
    }
    return json;
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const eToString = (e: any): string => {
  if (typeof e === "string") return e;
  else if (typeof e === "object") {
    if ("code" in e && "message" in e) {
      `${e.code}: ${e.message}`;
    } else if ("message" in e) {
      return eToString(e.message);
    } else if ("stack" in e) {
      return eToString(e.stack);
    }
  } else if (typeof e === "number") {
    return e.toString();
  }
  return "Something went wrong";
};
