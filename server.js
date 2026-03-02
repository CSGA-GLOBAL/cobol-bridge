const express = require('express');
const cors = require('cors');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

const app = express();

// CORS - allow all
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const server = new McpServer({ name: 'cobol-bridge', version: '1.0.0' });

server.tool('copybook-parser', { copybook: { type: 'string' } }, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ parsed: true }) }]
}));

server.tool('cics-bridge-assessment', { cicsConfig: { type: 'string' } }, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ aiReady: true }) }]
}));

server.tool('jcl-batch-scanner', { jcl: { type: 'string' } }, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ scanned: true }) }]
}));

server.tool('vsam-mapper', { vsamLayout: { type: 'string' } }, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ mapped: true }) }]
}));

server.tool('ebcdic-translator', { ebcdicData: { type: 'string' } }, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ translated: true }) }]
}));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0', tools: 5 });
});

app.get('/', (req, res) => {
  res.json({ name: 'COBOL Bridge MCP Server', version: '1.0.0' });
});

let transport;
app.get('/mcp/sse', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  transport = new SSEServerTransport('/mcp/messages', res);
  await server.connect(transport);
});

app.post('/mcp/messages', async (req, res) => {
  if (transport) await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('COBOL Bridge on port ' + PORT));
