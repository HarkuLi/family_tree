'use strict';
const nodemailer = require('nodemailer');

// mac app password
const macPass = 'jirpoqjcxyoysfeq';

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 587,
    secure: false, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'einfachstudio@gmail.com',
        pass: macPass
    },
    debug: true,
    disableFileAccess: true,
});

// setup email data with unicode symbols
 let mailOptions = {
    from: '"Fred Foo 👻" <admin@localhost>', // sender address
    to: 'test@localhost', // list of receivers
    subject: 'Hello ✔', // Subject line
    //text: 'Hello world ?', // plain text body
    html: '<b>Hello world ?</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
});

// verify connection configuration
transporter.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
   }
});