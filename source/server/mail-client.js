const SMTPConnection = require('nodemailer/lib/smtp-connection');

const connection = new SMTPConnection({
  port: 465,
  host: 'localhost',
  //secure: true,
  //requireTLS: true,
  name: "test-client",
  //connectionTimeout: 30*1000,
  //greetingTimeout: 60*1000,
  //socketTimeout: 60*1000,
  logger: true,
  debug: true
});

connection.connect(() => console.log("now connect to the smtp server"));

connection.login({
  credentials:{
    user: "familytreeadmin",
    pass: "!Dsl#a02lsavbc/3l1da"
  }
}, (err) => {
  if(err) return console.log(err);
  console.log("complete authentication.");
})
