# MCP Server Reference Implementation

This is a reference MCP Server implementation of the [draft Authorization spec updates](https://modelcontextprotocol.io/specification/draft/basic/authorization#2-3-authorization-server-discovery) using the official typescript sdk.

This repo can be used with this [Postman collection](https://www.postman.com/universal-crescent-673411/workspace/mcp-servers)

## Authentication Providers

There are two separate auth provider options:
1. Cognito
2. Keycloak (self-hosted)

We validate the scope: `mcp:access`, with `<resource-id>/mcp:access`. For example, `https://mcp-server.com/mcp:access`

## Important Note

Keep in mind that OAuth 2.1 doesn't allow `http` protocol, so you will want to use ngrok with a static url (available for free from ngrok) to properly test this out.

If you want to use localhost without ngrok because you don't care, you can override the PORT and PROTOCOL env variables for the authorization and resource servers by setting them in .envs (check config folder if you're confused)

## Setup with ngrok

1. Build and start the server:
   ```bash
   npm i
   npm run build
   npm run start
   ```

2. The MCP server will start on port 1335.

3. In another terminal, create the ngrok tunnel to the MCP server:
   ```bash
   ngrok http --domain=<get-a-custom-domain-from-ngrok(free)-and-place-here> 1335
   ```

4. Configure this resource server in the `Domains` tab of your [AWS Cognito dashboard](https://aws.amazon.com/es/cognito/)
