import jwt, { JwtPayload } from "jsonwebtoken";
import {
  ACCESS_TOKEN_SIGN_ALGORITHM,
  ALLOWED_JWT_TYP_HEADERS,
  AUDIENCE,
  KEYCLOAK_CONFIG,
  REALM,
} from "../../config/auth.config.js";
import jwksClient, { SigningKey } from "jwks-rsa";
import { buildUnauthorizedBearer as buildBearer } from "../utils.js";

const OAUTH_CERT_ENDPOINT = `${KEYCLOAK_CONFIG.AUTHORIZATION_SERVER_HOSTNAME}:${KEYCLOAK_CONFIG.AUTHORIZATION_SERVER_PORT}/realms/${REALM}/protocol/openid-connect/certs`;

const certClient = jwksClient({
  jwksUri: OAUTH_CERT_ENDPOINT,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 1000 * 60 * 10,
});

export const getIssuer = (): string => {
  return `${KEYCLOAK_CONFIG.AUTHORIZATION_SERVER_HOSTNAME}:${KEYCLOAK_CONFIG.AUTHORIZATION_SERVER_PORT}/realms/${REALM}`;
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
    audience: [AUDIENCE],
    ignoreExpiration: false,
    ignoreNotBefore: false,
    complete: true,
  }) as jwt.Jwt;
};

export const verifyTokenType = (decodedToken: jwt.Jwt): boolean => {
  return !!ALLOWED_JWT_TYP_HEADERS.find(
    (h) => h.toLowerCase() === decodedToken.header.typ?.toLowerCase()
  );
};

export const buildUnauthorizedBearer = (
  resourceMetadataUrl: string,
  error?: string,
  errorDescription?: string,
  requiredScopes?: string[]
) => {
  return buildBearer(
    resourceMetadataUrl,
    error,
    errorDescription,
    requiredScopes,
    REALM
  );
};

export const extractScopes = (payload: JwtPayload): string[] => {
  return ((payload.scope as string | undefined) ?? "").split(" ");
};
