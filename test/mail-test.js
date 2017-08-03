const net = require('net');

let port = 465;

net.connect(port, 'localhost', function() {
  console.log(`CONNECTED TO: localhost with port ${port}`);
  //i can write to a socket anything, still no response
  //client.write('HELO smtp.gmail.com');
})