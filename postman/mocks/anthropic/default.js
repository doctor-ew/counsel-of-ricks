// Focused Messages API fixture based on the Anthropic SDK v1 migration contract.
// Synthetic responses only; never forwards requests to the real provider.
const http = require('http');
const requests = [];
http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  if (req.method === 'GET' && req.url === '/requests') {
    return res.end(JSON.stringify(requests));
  }
  if (req.method !== 'POST' || req.url !== '/v1/messages') {
    res.statusCode = 501;
    return res.end(JSON.stringify({error: 'Endpoint not modeled'}));
  }
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    const body = JSON.parse(raw);
    requests.push({temperature: body.temperature, model: body.model});
    const prompt = body.messages.map(message => message.content).join('\n');
    let text = 'What did you observe next?';
    if (prompt.includes('Return a JSON object with two keys')) {
      text = JSON.stringify({inappropriate: false, facts: [{fact: 'Rick opened a portal.', confidence: 'certain'}]});
    } else if (prompt.includes('Check if any new facts contradict')) {
      text = '[]';
    } else if (prompt.includes('Generate exactly')) {
      text = JSON.stringify({questions: [{question: 'Where was the portal?', purpose: 'Establish location', followups: [], topic: 'location'}]});
    } else if (prompt.includes('index numbers (comma-separated)')) {
      text = '0';
    }
    res.end(JSON.stringify({
      id: 'msg_synthetic', type: 'message', role: 'assistant', model: body.model,
      content: prompt.includes('EMPTY_RESPONSE') ? [] : [{type: 'text', text}],
      stop_reason: 'end_turn', stop_sequence: null,
      usage: {input_tokens: 10, output_tokens: 10}
    }));
  });
}).listen(process.env.PORT);
