const WebSocket = require('ws');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (socket) => {
    console.log('User is online');

    socket.on('message', (msg) => {
      const message = msg.toString();
      const unpackedData = JSON.parse(message);
      const from = unpackedData.fromId;
      const to = unpackedData.toId;
      if(unpackedData.type == 'connect_user') {
        socket.userId = from;
      } else if(unpackedData.type == 'sendMsg') {
      wss.clients.forEach(client => {
        if(client.userId == to) {
          const payload = {
            type:'send_msg',
            fromId:from,
            text:unpackedData.text
          }
          client.send(JSON.stringify(payload))
        }
      })
      }
    });
  });
}

module.exports = setupWebSocket;