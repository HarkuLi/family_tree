'use strict';

const express = require('express');
const app = express();
//const Tree = require('./source/modules/tree.js');
//const Treant = require('treant-js');



const config = {
  appRoot: __dirname // required config
};

app.set('view engine', 'ejs');
app.set('views', './views')        // set views folder
app.use(express.static('public'))  // set static files folder

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

  res.render('pages/tree', {data: JSON.stringify(data)})
});

app.listen(10010, function () {
  console.log('Server is listening on port 10010!');
});