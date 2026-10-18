// Local, read-only synthetic responses shaped by app/schemas and frontend/src/types.
const http = require('http');
const fixture = require('./fixture.json');
const prefix = '/api/v1/sessions/';
http.createServer((req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1').pathname;
  const reply = (status, value) => {res.writeHead(status, {'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  if (req.method !== 'GET') return reply(501, {detail:'Synthetic read-only demo: application mutations and model calls are disabled.'});
  if (path === '/api/v1/health') return reply(200, {status:'synthetic-demo',database:'not-used'});
  if (path.startsWith(prefix) && path.split('/')[4] !== fixture.session.id) return reply(404, {detail:'Session not found'});
  if (path === prefix + fixture.session.id) return reply(200, fixture.session);
  if (path === prefix + fixture.session.id + '/messages') return reply(200, fixture.messages);
  if (path === prefix + fixture.session.id + '/ledger') return reply(200, fixture.ledger);
  return reply(501, {detail:'Endpoint not modelled by this local demonstration.'});
}).listen(process.env.PORT || 8001, '127.0.0.1');
