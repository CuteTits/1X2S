import fetch from 'node-fetch';

async function testOllama() {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'mistral', prompt: 'Hello!', stream: false })
  });
  const data = await res.json();
  console.log(data);
}

testOllama();
