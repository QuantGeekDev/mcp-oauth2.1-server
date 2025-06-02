import {
  getAuthorizationServerUrl,
  getResourceServerUrl,
  REQUIRED_SCOPES,
} from "../config/auth.config.js";

export const PROTECTED_RESOURCE_METADATA_ENDPOINT =
  "/.well-known/oauth-protected-resource";

export function getProtectedResourceMetadata(_req: any, res: any) {
  // For MCP clients, we should return our own server URL as the authorization server
  // This allows MCP clients to find the authorization metadata at our server
  const resourceServerUrl = getResourceServerUrl();

  res.status(200).json({
    resource: resourceServerUrl,
    authorization_servers: [resourceServerUrl], // Changed from getAuthorizationServerUrl()
    scopes_supported: REQUIRED_SCOPES,
    bearer_methods_supported: ["header"],
  });
}
