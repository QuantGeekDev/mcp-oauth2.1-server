import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
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
import {
  getAuthorizationServerMetadata,
  AUTHORIZATION_SERVER_METADATA_ENDPOINT,
} from "./auth/authorization-server-metadata.js";
import {
  registerClient,
  REGISTRATION_ENDPOINT,
} from "./auth/dynamic-client-registration.js";

const app = express();

// Configure CORS to allow all origins
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow all origins
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "mcp-session-id",
    "MCP-Protocol-Version",
  ],
  exposedHeaders: ["mcp-session-id", "WWW-Authenticate"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Log MCP Protocol Version if present
app.use((req: Request, res: Response, next: NextFunction) => {
  const protocolVersion = req.headers["mcp-protocol-version"];
  if (protocolVersion) {
    console.log(
      `MCP Protocol Version: ${protocolVersion} from ${req.method} ${req.path}`
    );
  }
  next();
});

app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Add root endpoint for debugging
app.get("/", (req, res) => {
  res.json({
    service: "MCP OAuth Server",
    version: "1.0.0",
    endpoints: {
      mcp: "/mcp",
      protected_resource_metadata: PROTECTED_RESOURCE_METADATA_ENDPOINT,
      authorization_server_metadata: AUTHORIZATION_SERVER_METADATA_ENDPOINT,
    },
    status: "running",
  });
});

app.get(PROTECTED_RESOURCE_METADATA_ENDPOINT, async (req, res) => {
  getProtectedResourceMetadata(req, res);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.get(AUTHORIZATION_SERVER_METADATA_ENDPOINT, async (req, res) => {
  getAuthorizationServerMetadata(req, res);
});

app.post(REGISTRATION_ENDPOINT, async (req, res) => {
  registerClient(req, res);
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
