// TODO: turn to establish haraka server
const SMTPServer = require('smtp-server').SMTPServer;
const options = {
  name: "localhost",
  banner: "Welcome to FamilyTree Mail Server!",
  size: 1024,  // maximum size per message
  authMethods: ['PLAIN', 'LOGIN'],
  logger: true,
  maxClients: 3, // maximum connecting clients
  //lmtp: true,  // address multi-receiver individually
  socketTimeout: 1000*60,  // socket inactive timeout
  closeTimeout: 1000*30,   // waiting time for disconnect pending connection when server close
  onAuth(auth, session, callback){
    if(auth.username !== 'familytreeadmin' || auth.password !== '123'){
      return callback(new Error('Invalid username or password'));
    }
    callback(null, {
      user: "admin"
    });
  },
  onConnect(session, callback){
    console.log(session);
    return callback(session);
  },
   onData(stream, session, callback){
    console.log('onData');
    stream.pipe(process.stdout); // print message to console
    stream.on('end', callback);
  }, 

}

const server = new SMTPServer(options);

server.listen(587, () => console.log("FamilyGroup Mail Server is listening 587 port."));