import {
  COGNITO_ENABLED,
  KEYCLOAK_ENABLED,
  RESOURCE_SERVER_HOSTNAME,
  RESOURCE_SERVER_PORT,
  RESOURCE_SERVER_PROTOCOL,
  AUTHORIZATION_SERVER_HOSTNAME,
  AUTHORIZATION_SERVER_REGION,
} from "./env.config.js";

export const AUTH_PROVIDER = {
  KEYCLOAK: KEYCLOAK_ENABLED,
  COGNITO: COGNITO_ENABLED,
};

if (!AUTH_PROVIDER.KEYCLOAK && !AUTH_PROVIDER.COGNITO) {
  throw new Error(
    "Invalid environment variable configuration - set either KEYCLOAK=true or COGNITO=true"
  );
}

export const AUDIENCE = "mcp-server";
export const REQUIRED_SCOPES = [
  `https://${RESOURCE_SERVER_HOSTNAME}/mcp:access`,
  "openid",
];
export const ALLOWED_JWT_TYP_HEADERS = ["at+jwt", "application/at+jwt"];
export const ACCESS_TOKEN_SIGN_ALGORITHM = "RS256";
export const WWW_AUTHENTICATE_HEADER = "WWW-Authenticate";
export const REALM = "mcp-realm";
export const PROTECTED_RESOURCE_METADATA_ENDPOINT =
  "/.well-known/oauth-protected-resource";

export const AUTHORIZATION_SERVER_PROTOCOL =
  process.env.AUTHORIZATION_SERVER_PROTOCOL || "https:";

export const COGNITO_CONFIG = {
  AUTHORIZATION_SERVER_HOSTNAME,
  AUTHORIZATION_SERVER_REGION,
  get OAUTH_CERT_ENDPOINT() {
    return `https://${this.AUTHORIZATION_SERVER_HOSTNAME}/${this.AUTHORIZATION_SERVER_REGION}/.well-known/jwks.json`;
  },
};

export const KEYCLOAK_CONFIG = {
  AUTHORIZATION_SERVER_HOSTNAME:
    process.env.AUTHORIZATION_SERVER_HOSTNAME || "localhost",
  AUTHORIZATION_SERVER_PORT: process.env.AUTHORIZATION_SERVER_PORT || "8080",
};

export const getAuthorizationServerUrl = () => {
  if (AUTH_PROVIDER.COGNITO) {
    return `${AUTHORIZATION_SERVER_PROTOCOL}//${COGNITO_CONFIG.AUTHORIZATION_SERVER_HOSTNAME}`;
  } else {
    return `${AUTHORIZATION_SERVER_PROTOCOL}//${KEYCLOAK_CONFIG.AUTHORIZATION_SERVER_HOSTNAME}:${KEYCLOAK_CONFIG.AUTHORIZATION_SERVER_PORT}`;
  }
};

export const getResourceServerUrl = () => {
  return `${RESOURCE_SERVER_PROTOCOL}//${RESOURCE_SERVER_HOSTNAME}${
    RESOURCE_SERVER_PORT ? `:${RESOURCE_SERVER_PORT}` : ""
  }`;
};

export const RESOURCE_METADATA_URL = `${getResourceServerUrl()}${PROTECTED_RESOURCE_METADATA_ENDPOINT}`;

export const TOKEN_VALIDATION_ERROR_CODE = {
  invalidToken: "invalid_token",
  invalidRequest: "invalid_request",
  insufficientScope: "insufficient_scope",
} as const;

export type TOKEN_VALIDATION_ERROR =
  (typeof TOKEN_VALIDATION_ERROR_CODE)[keyof typeof TOKEN_VALIDATION_ERROR_CODE];
