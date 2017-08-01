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
    }) // TODO: check whether 'result ' or '{ status: true }' is good
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
    let getFGID = identity.getFamilyID(req).then((fgid) => fgid);
    
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

        let filename = 'export-'+usr+'.txt';
        let path = config.tmpDir+filename;

        // create file and save to /tmp
        return Promise.resolve()
          .then(() => {
            return new Promise((resolve, reject) => {
              fs.writeFile(path, fileContent, (err) => {
                if (err) reject(err);
                resolve(console.log('[transport] Save temp file to /tmp success!'));
              });
            });
          })
          // send download response and waiting for finish cb
          .then(() => {
            return new Promise((resolve, reject) => {
              res.download(path, filename, (err) => {
                if (err) return Promise.reject(err);
                resolve(console.log('[transport] Client download file success!'));
              })
            });
          })
          // if success, delete tmp file with unlink its filename
          .then(() => {
            return new Promise((resolve, reject) => {
              return fs.unlink(path, (err) => (err) ? reject(err) : resolve(console.log('[transport] Remove temp file success!')))
            });
          })
          .catch((err) => {
            console.log('te')
            return Promise.reject(err);
          });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({ status: false, message: err});
      });
  });

module.exports = TransportRouterAPI;