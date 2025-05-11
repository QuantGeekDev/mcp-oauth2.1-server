import jwt, { JwtPayload } from "jsonwebtoken";

import jwksClient, { SigningKey } from "jwks-rsa";
import {
  ACCESS_TOKEN_SIGN_ALGORITHM,
  COGNITO_CONFIG,
} from "../../config/auth.config.js";

const certClient = jwksClient({
  jwksUri: COGNITO_CONFIG.OAUTH_CERT_ENDPOINT,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 1000 * 60 * 10,
});

export const getIssuer = (): string => {
  return `https://${COGNITO_CONFIG.AUTHORIZATION_SERVER_HOSTNAME}/${COGNITO_CONFIG.AUTHORIZATION_SERVER_REGION}`;
};

export const getSigningKey = async (kid: string): Promise<SigningKey> => {
  return await certClient.getSigningKey(kid);
};

export const verifyToken = async (
  token: string,
  signingKey: SigningKey
): Promise<jwt.Jwt> => {
  return jwt.verify(token, signingKey.getPublicKey(), {
    algorithms: [ACCESS_TOKEN_SIGN_ALGORITHM],
    issuer: getIssuer(),
    ignoreExpiration: false,
    ignoreNotBefore: false,
    complete: true,
  }) as jwt.Jwt;
};

export const buildUnauthorizedBearer = (resourceMetadataUrl: string) => {
  return `Bearer resource_metadata="${resourceMetadataUrl}"`;
};

export const extractScopes = (payload: JwtPayload): string[] => {
  return ((payload.scope as string | undefined) ?? "").split(" ");
};
