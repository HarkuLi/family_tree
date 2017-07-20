'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');


const config = {
  appRoot: __dirname // required config
};

app.set('view engine', 'ejs');
app.set('views', './views')        // set views folder
app.use(express.static('public'))  // set static files folder
app.use(bodyParser.json());        // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', function (req, res) {
  res.render('pages/index');
});

app.get('/tree', (req, res) => {
  let data = [
    { text: { name: "First child" } },
    { text: { name: "Second child" } },
    { text: { name: "Third child" } },
    { text: { name: "Four child" } },
  ];

  //ejs.compile('pages/tree', {client: true}); // Use client option
  res.render('pages/tree', {data: JSON.stringify(data)})
});

app.get('/mask/:page', function (req, res) {
  let path = 'partials/mask/mask-error.ejs';
  console.log(req.params);
  switch(req.params.page){
    case "signin": path = 'partials/mask/signin.ejs'; break;
    case "signup": path = 'partials/mask/signup.ejs'; break;
    case "qrcode": path = 'partials/mask/qrcode.ejs'; break;
    case "detail": path = 'partials/mask/detail.ejs'; break;
    case "load": path = 'partials/mask/async-load.ejs'; break;
  }
  res.render(path, { client: true });
});

app.listen(10010, function (err) {
  if(err) console.log(err);
  console.log('Server is listening on port 10010!');
});