import "dotenv/config";

export const RESOURCE_SERVER_PROTOCOL =
  process.env.RESOURCE_SERVER_PROTOCOL || "https:";

export const RESOURCE_SERVER_HOSTNAME =
  process.env.RESOURCE_SERVER_HOSTNAME || "localhost";

export const RESOURCE_SERVER_PORT = process.env.RESOURCE_SERVER_PORT;

export const KEYCLOAK_ENABLED = !!process.env.KEYCLOAK;
export const COGNITO_ENABLED = !!process.env.COGNITO;

export const AUTHORIZATION_SERVER_HOSTNAME =
  process.env.AUTHORIZATION_SERVER_HOSTNAME || "localhost";

export const AUTHORIZATION_SERVER_REGION =
  process.env.AUTHORIZATION_SERVER_REGION || "eu-west-3_XXXXXXXX";
