const SMTPServer = require('smtp-server').SMTPServer;
const options = {
  secure: true,
  //name: "FamilyTreeMail",
  banner: "Welcome to FamilyTree Mail Server!",
  size: 1024,  // maximum size per message
  authMethods: ['PLAIN', 'LOGIN', 'XOAUTH2'],
  logger: true,
  maxClients: 3, // maximum connecting clients
  //lmtp: true,  // address multi-receiver individually
  //socketTimeout: 1000*60,  // socket inactive timeout
  //closeTimeout: 1000*30,   // waiting time for disconnect pending connection when server close
  onAuth(auth, session, callback){
    if(auth.username !== 'familytreeadmin' || auth.password !== '!Dsl#a02lsavbc/3l1da'){
      return callback(new Error('Invalid username or password'));
      }
      callback(null, {
        user: "admin"
      }); // where 123 is the user id or similar property
  },

}

const server = new SMTPServer(options);

server.listen(465, () => console.log("FamilyGroup Mail Server is listening 465 port."));






