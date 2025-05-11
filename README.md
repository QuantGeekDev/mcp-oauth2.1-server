This is a reference MCP Server implementation of the [draft Authorization spec updates](https://modelcontextprotocol.io/specification/draft/basic/authorization#2-3-authorization-server-discovery) using the official typescript sdk.

It can be used with this postman collection

There are two separate auth provider options:
1. Cognito
2. Keycloak (self-hosted)

Keep in mind that OAuth 2.1 doesn't allow `http` protocol, so you will want to use ngrok with a static url (available for free from ngrok) to properly test this out.
If you want to use localhost without ngrok because you don't care, you can override the PORT and PROTOCOL env variables for the authorization and resource servers by setting them in .envs (check config folder if you're confused)

I will make a guide on how to set this up soon. Probably
