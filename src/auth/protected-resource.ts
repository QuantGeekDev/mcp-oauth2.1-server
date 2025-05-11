import {
  getAuthorizationServerUrl,
  getResourceServerUrl,
  REQUIRED_SCOPES,
} from "../config/auth.config.js";

export const PROTECTED_RESOURCE_METADATA_ENDPOINT =
  "/.well-known/oauth-protected-resource";

export function getProtectedResourceMetadata(_req: any, res: any) {
  res.status(200).json({
    resource: getResourceServerUrl(),
    authorization_servers: [getAuthorizationServerUrl()],
    scopes_supported: REQUIRED_SCOPES,
    bearer_methods_supported: ["header"],
  });
}
