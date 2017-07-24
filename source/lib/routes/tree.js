const express = require('express');
const controller = require('../controllers/tree');
const TreeAPI = express.Router();

TreeAPI.get('/', (req, res) => {
  let data = controller.test();

  //ejs.compile('pages/tree', {client: true}); // Use client option
  res.render('pages/tree', {data: JSON.stringify(data)})
});

module.exports = TreeAPI;