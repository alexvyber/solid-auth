import {
  AuthorizationError,
  type StrategyVerifyCallback,
} from '@solid-auth/core'
import {
  OAuth2Strategy,
  type OAuth2Profile,
  type OAuth2StrategyVerifyParams,
} from '@solid-auth/oauth'
import { SocialProvider } from '.'

export type GitHubScope =
  | 'repo'
  | 'repo:status'
  | 'repo_deployment'
  | 'public_repo'
  | 'repo:invite'
  | 'security_events'
  | 'admin:repo_hook'
  | 'write:repo_hook'
  | 'read:repo_hook'
  | 'admin:org'
  | 'write:org'
  | 'read:org'
  | 'admin:public_key'
  | 'write:public_key'
  | 'read:public_key'
  | 'admin:org_hook'
  | 'gist'
  | 'notifications'
  | 'user'
  | 'read:user'
  | 'user:email'
  | 'user:follow'
  | 'delete_repo'
  | 'write:discussion'
  | 'read:discussion'
  | 'write:packages'
  | 'read:packages'
  | 'delete:packages'
  | 'admin:gpg_key'
  | 'write:gpg_key'
  | 'read:gpg_key'
  | 'codespace'
  | 'workflow'

export interface GitHubStrategyOptions {
  clientID: string
  clientSecret: string
  callbackURL: string
  scope?: GitHubScope[]
  allowSignup?: boolean
  userAgent?: string
}

export interface GitHubProfile extends OAuth2Profile {
  id: string
  displayName: string
  name: {
    familyName: string
    givenName: string
    middleName: string
  }
  emails: [{ value: string }]
  photos: [{ value: string }]
  _json: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
    name: string
    company: string
    blog: string
    location: string
    email: string
    hireable: boolean
    bio: string
    twitter_username: string
    public_repos: number
    public_gists: number
    followers: number
    following: number
    created_at: string
    updated_at: string
    private_gists: number
    total_private_repos: number
    owned_private_repos: number
    disk_usage: number
    collaborators: number
    two_factor_authentication: boolean
    plan: {
      name: string
      space: number
      private_repos: number
      collaborators: number
    }
  }
}

export interface GitHubExtraParams extends Record<string, string | number> {
  tokenType: string
}

export const GitHubDefaultScopes: GitHubScope[] = ['user']
export const GitHubScopeSeperator = ' '

export class GitHubStrategy<User> extends OAuth2Strategy<
  User,
  GitHubProfile,
  GitHubExtraParams
> {
  name = SocialProvider.github

  private scope: GitHubScope[]
  private allowSignup: boolean
  private userAgent: string
  private userInfoURL = 'https://api.github.com/user'

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      allowSignup,
      userAgent,
    }: GitHubStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<GitHubProfile, GitHubExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: 'https://github.com/login/oauth/authorize',
        tokenURL: 'https://github.com/login/oauth/access_token',
      },
      verify
    )
    this.scope = scope || ['user']
    this.allowSignup = allowSignup ?? true
    this.userAgent = userAgent ?? 'Remix Auth'
  }

  protected authorizationParams(): URLSearchParams {
    return new URLSearchParams({
      scope: this.scope.join(GitHubScopeSeperator),
      allow_signup: String(this.allowSignup),
    })
  }

  protected async userProfile(accessToken: string): Promise<GitHubProfile> {
    const response = await fetch(this.userInfoURL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${accessToken}`,
        'User-Agent': this.userAgent,
      },
    })
    const data: GitHubProfile['_json'] = await response.json()

    const profile: GitHubProfile = {
      provider: SocialProvider.github,
      displayName: data.login,
      id: data.id.toString(),
      name: {
        familyName: data.name,
        givenName: data.name,
        middleName: data.name,
      },
      emails: [{ value: data.email }],
      photos: [{ value: data.avatar_url }],
      _json: data,
    }

    return profile
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string
    refreshToken: string
    extraParams: GitHubExtraParams
  }> {
    const data = await response.text()

    const accessToken = new URLSearchParams(data).get('access_token')
    if (!accessToken) throw new AuthorizationError('Missing access token.')

    const tokenType = new URLSearchParams(data).get('token_type')
    if (!tokenType) throw new AuthorizationError('Missing token type.')

    return {
      accessToken,
      refreshToken: '',
      extraParams: { tokenType },
    } as const
  }
}
