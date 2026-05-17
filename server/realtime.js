const clients = new Set();

function send(client, event) {
  try {
    client.res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch (err) {
    clients.delete(client);
  }
}

function addClient(user, res) {
  const client = { user, res };
  clients.add(client);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  send(client, { type: 'connected', at: new Date().toISOString() });

  const heartbeat = setInterval(() => {
    send(client, { type: 'heartbeat', at: new Date().toISOString() });
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

function emitToUser(userID, type, payload = {}) {
  for (const client of clients) {
    if (String(client.user?.userID) === String(userID)) {
      send(client, { type, payload, at: new Date().toISOString() });
    }
  }
}

function emitToRole(role, type, payload = {}) {
  const target = String(role || '').toLowerCase();
  for (const client of clients) {
    if (String(client.user?.role || '').toLowerCase() === target) {
      send(client, { type, payload, at: new Date().toISOString() });
    }
  }
}

function emitToAll(type, payload = {}) {
  for (const client of clients) {
    send(client, { type, payload, at: new Date().toISOString() });
  }
}

module.exports = { addClient, emitToUser, emitToRole, emitToAll };
