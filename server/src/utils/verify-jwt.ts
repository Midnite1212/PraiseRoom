import { JWTVerifyGetKey, createRemoteJWKSet, jwtVerify } from 'jose';
import { isUserIdString } from './validation';

export type TokenIdentity = {
  id: string;
  emailAddress?: string;
  name?: string;
};

export type TokenUser = TokenIdentity & {
  accessType: string;
};

let keySet: { url: string; getKey: JWTVerifyGetKey } | undefined;

const keySetFor = (authUrl: string): JWTVerifyGetKey => {
  const url = `${authUrl.replace(/\/+$/, '')}/.well-known/jwks.json`;
  if (keySet?.url !== url) keySet = { url, getKey: createRemoteJWKSet(new URL(url)) };
  return keySet.getKey;
};

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

const verifyToken = async (token: string): Promise<TokenIdentity | null> => {
  const authUrl = process.env.NEON_AUTH_URL;
  if (!token || !authUrl) return null;

  try {
    const { payload } = await jwtVerify(token, keySetFor(authUrl), {
      algorithms: ['EdDSA'],
      issuer: new URL(authUrl).origin,
    });
    if (!isUserIdString(payload.sub) || payload.banned === true) return null;
    return {
      id: payload.sub,
      emailAddress: optionalString(payload.email),
      name: optionalString(payload.name),
    };
  } catch {
    return null;
  }
};

export default verifyToken;
