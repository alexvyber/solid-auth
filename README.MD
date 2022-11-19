### Solid Auth

Recommended to use [create jd app](https://github.com/OrJDev/create-jd-app)

```bash
npm install solidjs-auth
```

### Creating Session Storage

```ts
// /auth.ts
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

### Creating An Authenticator Client

You can choose any provider you wish, in this examle we are going to use discord and prisma

```ts
// server/auth.ts
import { type User } from "@prisma/client"; // any user type you wish
import { prisma } from "./db/client"; // any db you wish
import { sessionStorage } from "~/auth"; // the session storage we created before
import { Authenticator, DiscordStrategy } from "solidjs-auth";

export const authenticator = new Authenticator<User>(sessionStorage).use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.SITE_URL + "/auth/discord/callback",
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
            avatar: profile.photos[0],
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

### Supported Providers

Check out [remix auth social](https://github.com/TheRealFlyingCoder/remix-auth-socials) for more info

- Discord
- Github
- Google
- FaceBook
- Microsoft

### Credits

All credits belong to [remix auth](https://github.com/sergiodxa/remix-auth) & [remix auth social](https://github.com/TheRealFlyingCoder/remix-auth-socials) team who worked really hard on this (all i did was replacing remix stuff with solid start).
