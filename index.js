const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json())
const PORT = process.env.PORT || 10000;

// console.log(PORT, " portttt")
const http = require('http');
const WebSocketServer = require('websocket').server

const server = http.createServer(app);

// Define a route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

const senderList = {};

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  let connection = request.accept('echo-protocol', request.origin);
  // console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      // console.log('Received Message ->>>> ' + message.utf8Data);
      const textObj = JSON.parse(message.utf8Data);
      if(textObj.id == ''){
        console.log("invalid id -> ", textObj.id)
        return;
      }

      //check for init
      if (textObj.type == 'init') {
        senderList[textObj.id] = connection;
        console.log(Object.keys(senderList), " senderlist")

      }
      else if(textObj.type == 'chat') {
        console.log("chatinggggg");

        Object.keys(senderList).forEach((participant) => {
          if(participant != textObj.id){
            const recepientConnection = senderList[participant];
            recepientConnection.sendUTF(JSON.stringify( textObj));
            console.log(participant, textObj.id)
          }
        })
      }
      // connection.sendUTF(message.utf8Data);
    }
    // else if (message.type === 'binary') {
    //   console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
    //   connection.sendBytes(message.binaryData);
    // }
  });
  connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
