import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { requireAuthentication } from "./auth/middleware.js";
import "dotenv/config";
import {
  getProtectedResourceMetadata,
  PROTECTED_RESOURCE_METADATA_ENDPOINT,
} from "./auth/protected-resource.js";

const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.get(PROTECTED_RESOURCE_METADATA_ENDPOINT, async (req, res) => {
  getProtectedResourceMetadata(req, res);
});

app.post("/mcp", requireAuthentication, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: "MCP-Resource-Server",
      version: "1.0.0",
    });

    server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
      content: [{ type: "text", text: `The sum of ${a} and ${b} is ${a + b}` }],
    }));

    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get("/mcp", requireAuthentication, handleSessionRequest);

app.delete("/mcp", requireAuthentication, handleSessionRequest);

const PORT = process.env.PORT || 1335;

app.listen(PORT);

console.log(`MCP Server is running on port ${PORT}`);
