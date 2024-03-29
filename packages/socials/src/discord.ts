import { type StrategyVerifyCallback } from '@solid-auth/core'
import {
  OAuth2Strategy,
  type OAuth2Profile,
  type OAuth2StrategyVerifyParams,
} from '@solid-auth/oauth2'
import { SocialProvider } from '.'

/**
 * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
 */
export type DiscordScope =
  | 'activities.read'
  | 'activities.write'
  | 'applications.builds.read'
  | 'applications.builds.upload'
  | 'applications.commands'
  | 'applications.commands.update'
  | 'applications.entitlements'
  | 'applications.store.update'
  | 'bot'
  | 'connections'
  | 'email'
  | 'gdm.join'
  | 'guilds'
  | 'guilds.join'
  | 'guilds.members.read'
  | 'identify'
  | 'messages.read'
  | 'relationships.read'
  | 'rpc'
  | 'rpc.activities.write'
  | 'rpc.notifications.read'
  | 'rpc.voice.read'
  | 'rpc.voice.write'
  | 'webhook.incoming'

export interface DiscordStrategyOptions {
  clientID: string
  clientSecret: string
  callbackURL: string
  /**
   * @default ["identify", "email"]
   *
   * See all the possible scopes:
   * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
   */
  scope?: DiscordScope[]
  prompt?: 'none' | 'consent'
}

/**
 * @
 */
export interface DiscordProfile extends OAuth2Profile {
  id: string
  displayName: string
  emails?: [{ value: string }]
  photos: [{ value: string }]
  __json: {
    /**
     * the user's id
     */
    id: string
    /**
     * the user's username, not unique across the platform
     */
    username: string
    /**
     * the user's 4-digit discord-tag
     */
    discriminator: string
    /**
     * the user's avatar hash
     * @see https://discord.com/developers/docs/reference#image-formatting
     */
    avatar: string | null
    /**
     * whether the user belongs to an OAuth2 application
     */
    bot?: boolean
    /**
     * whether the user is an Official Discord System user (part of the urgent message system)
     */
    system?: boolean
    /**
     * whether the user has two factor enabled on their account
     */
    mfa_enabled?: boolean
    /**
     * the user's banner hash
     * @see https://discord.com/developers/docs/reference#image-formatting
     */
    banner?: string | null
    /**
     * the user's banner color encoded as an integer representation of hexadecimal color code
     */
    accent_color?: string | null
    /**
     * the user's chosen language option
     */
    locale?: string
    /**
     * 	whether the email on this account has been verified
     */
    verified?: boolean
    /**
     * the user's email
     */
    email?: string | null
    /**
     * the flags on a user's account
     * @see https://discord.com/developers/docs/resources/user#user-object-user-flags
     */
    flags?: number
    /**
     * the type of Nitro subscription on a user's account
     * @see https://discord.com/developers/docs/resources/user#user-object-premium-types
     */
    premium_type?: number
    /**
     * the public flags on a user's account
     * @see https://discord.com/developers/docs/resources/user#user-object-user-flags
     */
    public_flags?: number
  }
}

export interface DiscordExtraParams
  extends Record<string, Array<DiscordScope> | string | number> {
  expires_in: 604_800
  token_type: 'Bearer'
  scope: string
}

export const DiscordDefaultScopes: DiscordScope[] = ['identify', 'email']
export const DiscordScopeSeperator = ' '

export class DiscordStrategy<User> extends OAuth2Strategy<
  User,
  DiscordProfile,
  DiscordExtraParams
> {
  name = SocialProvider.discord

  private scope: DiscordScope[]
  private prompt?: 'none' | 'consent'
  private userInfoURL = 'https://discord.com/api/users/@me'

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      prompt,
    }: DiscordStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<DiscordProfile, DiscordExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: 'https://discord.com/api/oauth2/authorize',
        tokenURL: 'https://discord.com/api/oauth2/token',
      },
      verify
    )

    this.scope = scope || DiscordDefaultScopes
    this.prompt = prompt
  }

  protected authorizationParams() {
    const params = new URLSearchParams({
      scope: this.scope.join(DiscordScopeSeperator),
    })
    if (this.prompt) params.set('prompt', this.prompt)
    return params
  }

  protected async userProfile(accessToken: string): Promise<DiscordProfile> {
    const response = await fetch(this.userInfoURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const raw: DiscordProfile['__json'] = await response.json()
    const newAvatar =
      raw.avatar === null
        ? `https://cdn.discordapp.com/embed/avatars/${
            parseInt(raw.discriminator) % 5
          }.png`
        : `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.${
            raw.avatar.startsWith('a_') ? 'gif' : 'png'
          }`
    const profile: DiscordProfile = {
      provider: SocialProvider.discord,
      id: raw.id,
      displayName: raw.username,
      emails: raw.email ? [{ value: raw.email }] : undefined,
      photos: [{ value: newAvatar }],
      __json: {
        ...raw,
        avatar: newAvatar,
      },
    }
    return profile
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string
    refreshToken: string
    extraParams: DiscordExtraParams
  }> {
    const { access_token, refresh_token, scope, ...extraParams } =
      await response.json()
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      extraParams: { ...extraParams, scope: scope.split(' ') },
    }
  }
}
