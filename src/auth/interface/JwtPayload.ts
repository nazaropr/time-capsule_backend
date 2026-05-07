export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export type ITokens = {
  access_token: string;
  refresh_token: string;
};

export type IAccessToken = Omit<ITokens, 'refresh_token'>;
