import { Request, Response } from "express";
import {
  getAuthorizationServerUrl,
  getResourceServerUrl,
  AUTH_PROVIDER,
  COGNITO_CONFIG,
  KEYCLOAK_CONFIG,
  AUTHORIZATION_SERVER_PROTOCOL,
} from "../config/auth.config.js";

export const AUTHORIZATION_SERVER_METADATA_ENDPOINT =
  "/.well-known/oauth-authorization-server";

export function getAuthorizationServerMetadata(_req: Request, res: Response) {
  const baseUrl = getAuthorizationServerUrl();
  const resourceServerUrl = getResourceServerUrl();

  // For external auth providers, we need to provide their actual endpoints
  let authorizationEndpoint: string;
  let tokenEndpoint: string;
  let jwksUri: string;

  if (AUTH_PROVIDER.COGNITO) {
    // Cognito endpoints follow a specific pattern
    authorizationEndpoint = `${baseUrl}/oauth2/authorize`;
    tokenEndpoint = `${baseUrl}/oauth2/token`;
    jwksUri = `${baseUrl}/.well-known/jwks.json`;
  } else if (AUTH_PROVIDER.KEYCLOAK) {
    // Keycloak endpoints - adjust the realm name as needed
    const realmName = process.env.KEYCLOAK_REALM || "master";
    authorizationEndpoint = `${baseUrl}/realms/${realmName}/protocol/openid-connect/auth`;
    tokenEndpoint = `${baseUrl}/realms/${realmName}/protocol/openid-connect/token`;
    jwksUri = `${baseUrl}/realms/${realmName}/protocol/openid-connect/certs`;
  } else {
    // Default fallback endpoints
    authorizationEndpoint = `${baseUrl}/authorize`;
    tokenEndpoint = `${baseUrl}/token`;
    jwksUri = `${baseUrl}/.well-known/jwks.json`;
  }

  const metadata = {
    issuer: baseUrl,
    authorization_endpoint: authorizationEndpoint,
    token_endpoint: tokenEndpoint,
    registration_endpoint: `${resourceServerUrl}/register`,
    jwks_uri: jwksUri,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [
      "openid",
      "https://" + process.env.RESOURCE_SERVER_HOSTNAME + "/mcp:access",
    ],
  };

  res.status(200).json(metadata);
}
