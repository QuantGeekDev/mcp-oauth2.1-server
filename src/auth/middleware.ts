import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  AUTH_PROVIDER,
  REQUIRED_SCOPES,
  RESOURCE_METADATA_URL,
  TOKEN_VALIDATION_ERROR,
  TOKEN_VALIDATION_ERROR_CODE,
  WWW_AUTHENTICATE_HEADER,
} from "../config/auth.config.js";
import * as cognitoProvider from "./providers/cognito.js";
import * as keycloakProvider from "./providers/keycloak.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthInfo;
  }
}

export async function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    sendUnauthorizedErrorResponse(
      res,
      TOKEN_VALIDATION_ERROR_CODE.invalidRequest,
      "Missing authorization header"
    );
    return;
  }

  const [type, token] = authHeader.split(" ");
  if (type.toLowerCase() !== "bearer" || !token) {
    sendUnauthorizedErrorResponse(
      res,
      TOKEN_VALIDATION_ERROR_CODE.invalidRequest,
      "Invalid authorization scheme or token"
    );
    return;
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (
      !decodedToken ||
      !decodedToken.header.kid ||
      typeof decodedToken.header.kid !== "string"
    ) {
      sendUnauthorizedErrorResponse(
        res,
        TOKEN_VALIDATION_ERROR_CODE.invalidToken,
        "Invalid token format or missing key ID"
      );
      return;
    }

    const provider = AUTH_PROVIDER.COGNITO ? cognitoProvider : keycloakProvider;

    const kid = decodedToken.header.kid;
    const signingKey = await provider.getSigningKey(kid);

    const decoded = await provider.verifyToken(token, signingKey);

    if (AUTH_PROVIDER.KEYCLOAK && !keycloakProvider.verifyTokenType(decoded)) {
      sendUnauthorizedErrorResponse(
        res,
        TOKEN_VALIDATION_ERROR_CODE.invalidToken,
        "Invalid token type"
      );
      return;
    }

    const payload = decoded.payload as jwt.JwtPayload;
    const scopes = provider.extractScopes(payload);

    if (!verifyScopes(scopes, REQUIRED_SCOPES)) {
      console.log("Insufficient scopes", scopes, REQUIRED_SCOPES);
      sendUnauthorizedErrorResponse(
        res,
        TOKEN_VALIDATION_ERROR_CODE.insufficientScope,
        "Insufficient scopes",
        REQUIRED_SCOPES
      );
      return;
    }

    req.auth = {
      token,
      clientId: payload.client_id,
      scopes: scopes,
      expiresAt: payload.exp,
    };

    next();
  } catch (error) {
    console.log("Error verifying JWT token:", error);
    let description: string | undefined = undefined;

    if (error instanceof Error) {
      description = error.message;
    }

    sendUnauthorizedErrorResponse(
      res,
      TOKEN_VALIDATION_ERROR_CODE.invalidToken,
      description
    );
  }
}

export function verifyScopes(
  scopes: string[],
  requiredScopes: string[]
): boolean {
  return !requiredScopes.some((scope) => !scopes.includes(scope));
}

export function sendUnauthorizedErrorResponse(
  res: Response,
  error?: TOKEN_VALIDATION_ERROR,
  errorDescription?: string,
  requiredScopes?: string[]
) {
  console.log("Sending unauthorized error response", error, errorDescription);
  const provider = AUTH_PROVIDER.COGNITO ? cognitoProvider : keycloakProvider;

  const bearer = provider.buildUnauthorizedBearer(
    RESOURCE_METADATA_URL,
    error,
    errorDescription,
    requiredScopes
  );

  res.setHeader(WWW_AUTHENTICATE_HEADER, bearer);
  res.sendStatus(401);
}
