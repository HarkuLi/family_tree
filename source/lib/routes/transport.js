'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const identity = require("../controllers/identity");
const config = require('../../config/default');
const fs = require('fs');
const TransportController = require("../controllers/transport");

const TransportRouterAPI = express.Router();

// TAG: [fn] Import Backup Data File
TransportRouterAPI.post('/import', (req, res) => {
  let fileContent = req.body.file;
  identity.isSignin(req)
    .then((usr) => TransportController.importAllData(usr, fileContent))
    .then((result) => {
      return res.send({status: true});
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({ status: false, message: err});
    });
});

// TAG: [fn] Export Backup Data File
TransportRouterAPI.post('/export', (req, res) => {
    let usr = false;
    let fgid = '';
    let getUsr = identity.isSignin(req).then((usr) => usr);
    let getFGID = identity.getFamilyID(req).then((fgid) => fgid).catch((err) => console.log(err));
    
    Promise.all([getUsr, getFGID])
      .then((result) => {
        // check login status
        if(!result[0])  return Promise.reject("[transport] no login");
        if(!result[1])  return Promise.reject("[transport] cannot find fgid by usr");
        usr = result[0];
        fgid = result[1];
        
        return TransportController.exportAllData(usr, fgid);
      })
      .then((fileContent) => {
        // data uri
        let filename = 'export-'+usr+'.txt';
        let encodedFileContent = Buffer.from(fileContent).toString('base64');
        res.json({ status: true, data: encodedFileContent });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({ status: false, message: err});
      });
  });

module.exports = TransportRouterAPI;