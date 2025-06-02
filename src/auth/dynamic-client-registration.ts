import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { AUTH_PROVIDER } from "../config/auth.config.js";

// In-memory storage for registered clients
// In production, this should be persisted to a database
const registeredClients = new Map<string, any>();

export const REGISTRATION_ENDPOINT = "/register";

export interface ClientRegistrationRequest {
  client_name?: string;
  redirect_uris: string[];
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
  token_endpoint_auth_method?: string;
}

export interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  client_name?: string;
  token_endpoint_auth_method: string;
}

export function registerClient(req: Request, res: Response) {
  try {
    // Log incoming request details for debugging
    console.log("Registration request received:");
    console.log("- Origin:", req.headers.origin);
    console.log("- Method:", req.method);
    console.log("- Headers:", req.headers);

    const registrationRequest = req.body as ClientRegistrationRequest;

    // Validate required fields
    if (
      !registrationRequest.redirect_uris ||
      registrationRequest.redirect_uris.length === 0
    ) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "redirect_uris is required and must not be empty",
      });
    }

    // If using Cognito, return the pre-configured client ID
    if (AUTH_PROVIDER.COGNITO) {
      const cognitoClientId = process.env.COGNITO_CLIENT_ID;

      if (!cognitoClientId) {
        return res.status(500).json({
          error: "server_error",
          error_description:
            "Cognito client ID not configured. Please set COGNITO_CLIENT_ID environment variable.",
        });
      }

      // Validate that redirect URIs are allowed
      // In production, you should validate against the URIs configured in Cognito
      const allowedRedirectUris =
        process.env.COGNITO_ALLOWED_REDIRECT_URIS?.split(",") || [];

      if (allowedRedirectUris.length > 0) {
        const invalidUris = registrationRequest.redirect_uris.filter(
          (uri) =>
            !allowedRedirectUris.some((allowed) => uri.startsWith(allowed))
        );

        if (invalidUris.length > 0) {
          console.warn(
            `Warning: Redirect URIs not in allowed list: ${invalidUris.join(
              ", "
            )}`
          );
          console.warn(`Allowed URIs: ${allowedRedirectUris.join(", ")}`);
          // In production, you might want to reject these
          // return res.status(400).json({
          //   error: "invalid_request",
          //   error_description: `Redirect URIs not allowed: ${invalidUris.join(', ')}`
          // });
        }
      }

      console.log(
        `Returning pre-configured Cognito client ID: ${cognitoClientId}`
      );

      // Return the Cognito client info
      const clientData: ClientRegistrationResponse = {
        client_id: cognitoClientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        redirect_uris: registrationRequest.redirect_uris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        client_name: registrationRequest.client_name,
        token_endpoint_auth_method: "none",
      };

      return res.status(201).json(clientData);
    }

    // For non-Cognito providers, continue with dynamic registration
    // Validate redirect URIs
    for (const uri of registrationRequest.redirect_uris) {
      try {
        const url = new URL(uri);
        // Allow localhost for development, otherwise require HTTPS
        if (
          url.protocol !== "https:" &&
          url.hostname !== "localhost" &&
          url.hostname !== "127.0.0.1"
        ) {
          return res.status(400).json({
            error: "invalid_request",
            error_description:
              "redirect_uris must use HTTPS (except for localhost)",
          });
        }
      } catch (e) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Invalid redirect URI format",
        });
      }
    }

    // Generate client credentials
    const clientId = `mcp_client_${randomUUID()}`;
    const issuedAt = Math.floor(Date.now() / 1000);

    // Create client registration response
    const clientData: ClientRegistrationResponse = {
      client_id: clientId,
      client_id_issued_at: issuedAt,
      redirect_uris: registrationRequest.redirect_uris,
      grant_types: registrationRequest.grant_types || [
        "authorization_code",
        "refresh_token",
      ],
      response_types: registrationRequest.response_types || ["code"],
      client_name: registrationRequest.client_name,
      token_endpoint_auth_method:
        registrationRequest.token_endpoint_auth_method || "none",
    };

    // For public clients (which MCP clients typically are), we don't issue a client secret
    // The spec says token_endpoint_auth_method "none" is for public clients
    if (
      registrationRequest.token_endpoint_auth_method ===
        "client_secret_basic" ||
      registrationRequest.token_endpoint_auth_method === "client_secret_post"
    ) {
      clientData.client_secret = randomUUID();
      clientData.client_secret_expires_at = 0; // 0 means it doesn't expire
    }

    // Store the registered client
    registeredClients.set(clientId, {
      ...clientData,
      scope:
        registrationRequest.scope ||
        "openid https://" +
          process.env.RESOURCE_SERVER_HOSTNAME +
          "/mcp:access",
      registered_at: new Date().toISOString(),
    });

    console.log(
      `Registered new MCP client: ${clientId} for ${
        registrationRequest.client_name || "Unknown"
      }`
    );

    // Return the registration response
    res.status(201).json(clientData);
  } catch (error) {
    console.error("Error registering client:", error);
    res.status(500).json({
      error: "server_error",
      error_description: "Failed to register client",
    });
  }
}

// Helper function to validate if a client is registered
export function isClientRegistered(clientId: string): boolean {
  return registeredClients.has(clientId);
}

// Helper function to get client data
export function getClientData(clientId: string) {
  return registeredClients.get(clientId);
}
