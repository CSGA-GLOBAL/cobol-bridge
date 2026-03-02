const express = require('express');
const cors = require('cors');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

const app = express();
app.use(cors());
app.use(express.json());

const server = new McpServer({ name: 'cobol-bridge', version: '1.0.0' });

server.tool('copybook-parser', { copybook: { type: 'string' } }, async ({ copybook }) => {
  return { content: [{ type: 'text', text: JSON.stringify({ parsed: true, fields: [], piiDetected: [] }) }] };
});

server.tool('cics-bridge-assessment', { cicsConfig: { type: 'string' } }, async () => {
  return { content: [{ type: 'text', text: JSON.stringify({ aiReady: true }) }] };
});

server.tool('jcl-batch-scanner', { jcl: { type: 'string' } }, async () => {
  return { content: [{ type: 'text', text: JSON.stringify({ scanned: true, jobs: [] }) }] };
});

server.tool('vsam-mapper', { vsamLayout: { type: 'string' } }, async () => {
  return { content: [{ type: 'text', text: JSON.stringify({ mapped: true, schema: {} }) }] };
});

server.tool('ebcdic-translator', { ebcdicData: { type: 'string' }, encoding: { type: 'string' } }, async () => {
  return { content: [{ type: 'text', text: JSON.stringify({ translated: true }) }] };
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0', tools: ['copybook-parser', 'cics-bridge-assessment', 'jcl-batch-scanner', 'vsam-mapper', 'ebcdic-translator'] });
});

app.get('/', (req, res) => {
  res.json({ name: 'COBOL Bridge MCP Server', version: '1.0.0' });
});

let transport;
app.get('/mcp/sse', async (req, res) => {
  transport = new SSEServerTransport('/mcp/messages', res);
  await server.connect(transport);
});

app.post('/mcp/messages', async (req, res) => {
  if (transport) await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('COBOL Bridge on port ' + PORT));
