### Solid Auth

Recommended to use [create jd app](https://github.com/OrJDev/create-jd-app)

```bash
npm install solidjs-auth
```

### Enviroment Variables

- Set the `SITE_URL` to your production / local url when using oauth2 to get the callback url to work.

### Creating Session Storage

```ts
// utils/auth.ts
import { createCookieSessionStorage } from "solid-start";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    secrets: ["safajfas9234?Sfds"], // replace this with an actual secret
    secure: true,
  },
});
```

### Creating An Authenticator 

You can choose any provider you wish, in this examle we are going to use discord and prisma

```ts
// server/auth.ts
import { type User } from "@prisma/client"; // any user type you wish
import { prisma } from "./db/client"; // any db you wish
import { sessionStorage } from "~/utils/auth"; // the session storage we created before
import { Authenticator, DiscordStrategy } from "solidjs-auth";

export const authenticator = new Authenticator<User>(sessionStorage).use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.SITE_URL + "/api/auth/discord/callback", // the variable we created above
    },
    async ({ profile }) => {
      let user = await prisma.user.findUnique({
        where: {
          id: profile.id,
        },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: profile.id,
            displayName: profile.__json.username,
            avatar: profile.photos[0].value,
          },
        });
      }
      return user;
    }
  )
);
```

### Creating A Client

```ts
// utils/auth.ts
import { createSolidAuthClient } from "solidjs-auth";
const myURL = "http://localhost:3000";
export const authClient = createSolidAuthClient(`${myURL}/api/auth`);
```

### Creating The API Handler

```ts
// routes/api/auth/[...solidauth].ts
import { type User } from "@prisma/client"; // the type of that user
import { authenticator } from "~/server/auth"; // the Authenticator we created before
import { createSolidAuthHandler } from "solidjs-auth";

const handler = createSolidAuthHandler<User>(authenticator);

export const POST = handler;
export const GET = handler;
```

### Protected Routers

As you know SolidStart routeData is being loaded while rendering the page, therefore the user can access protected content for about few seconds before the page redirects him to the login page, so I had to figure out how to create an actual protected router and here is what i came up with:

```tsx
import { type User } from "@prisma/client"; // the type of the user
import { Match, Switch, type Component } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$, redirect } from "solid-start/server";
import { authenticator } from "~/server/auth"; // where your authenticator is located

export const withProtected = (Component: ProtectedRouter) => {
  const routeData = () => {
    return createServerData$(async (_, { request }) => {
      const user = await authenticator.isAuthenticated(request);
      if (!user) {
        throw redirect("/account");
      }
      return user;
    });
  };
  return {
    routeData,
    Page: () => {
      const current = useRouteData<typeof routeData>();
      return (
        <Switch fallback={<Component {...(current() as User)} />}>
          <Match when={current.loading || current() instanceof Response}>
            <Spinner />
          </Match>
        </Switch>
      );
    },
  };
};

export type ProtectedRouter = Component<User>;
```

"But this seems complicated" you might say, well it actually isn't, check out how easily it can be used:

```tsx
import { withProtected } from "../layouts/Protected";

// this will only get mounted when user is logged in
export const { routeData, Page } = withProtected((user) => {
  // user is typesafed, meaning that you don't need to use ?.displayName
  return <h1>Hey {user.displayName}</h1>;
});

// The page will be wrapped in a switch that will handle the dirty for us
export default Page;
```

### Project examples

#### Hackernews + Github Auth

- [View Code](https://github.com/nexxeln/hackernews)
- [Try It Yourself](https://hn.nxl.sh/)

#### Todos + Discord Auth

- [View Code](https://github.com/OrJDev/jd-todos)
- [Try It Yourself](https://jd-todos.vercel.app/)

Check out [remix auth social](https://github.com/TheRealFlyingCoder/remix-auth-socials) for more info

- Discord
- Github
- Google
- FaceBook
- Microsoft

### Credits

All credits belong to [remix auth](https://github.com/sergiodxa/remix-auth) & [remix auth social](https://github.com/TheRealFlyingCoder/remix-auth-socials) team who worked really hard on this (all i did was replacing remix stuff with solid start).
