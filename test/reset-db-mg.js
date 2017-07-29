'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Connection = MongoClient.connect('mongodb://localhost:3000/familytree')
const collectionName = 'mailgroup';


function getTestData(){
  let GroupCount = 3;
  let DataSet = [];

  for(let i = 0; i < GroupCount; ++i){
    let now = new Date().getTime() + Math.floor(Math.random()*10000)+1;
    let group = {
      name: "test-group-"+i,
      admin: [],
      authority: {},
      createTime: now,
      modifyTime: now,
      fgid: '596da10db6caf43f6d67d56c'
    };
    //group.enable = (Math.floor((Math.random()*10))%2) ? true : false;
    group.enable = true;
    DataSet.push(group);
  }
  // for adding target test memberlist
  DataSet[0].memberlist = [
    { 
      mbid: new ObjectID(),
      pid: "596d9a8af47458691441bb5a"
    },{
      mbid: new ObjectID(),
      name: "name0",
      email: "name0@gmail.com"
    }
  ];
  DataSet[1].memberlist = [
    { 
      mbid: new ObjectID(),
      pid: "596d9afdf47458691441bb5b"
    },{
      mbid: new ObjectID(),
      pid: "596d9afdf47458691441bb5c",
      name: "name2",
      email: "name2@gmail.com"
    }
  ];
  DataSet[2].memberlist = [
    { 
      mbid: new ObjectID(),
      pid: "596d9afdf47458691441bb5c"
    },{
      mbid: new ObjectID(),
      name: "name3",
      email: "name3@gmail.com",
    },{
      mbid: new ObjectID(),
      name: "name5",
      email: "name5@gmail.com",
    },{
      mbid: new ObjectID(),
      pid: "596d9bbff47458691441bb5e"
    }
  ];
  console.log('[DB Reset][mailgroup] generate new target test data success.');
  return DataSet;
}

function initial(){
  console.log('[DB Reset][mailgroup] start reset collection mailler.');
  Connection
    .then((DB) => {
      let checkCollectionExist = DB.listCollections().toArray().then((collecs) => {
        if(collecs.some((e) => e.name === collectionName)){
          DB.collection(collectionName).drop((err, result) => {
            if(err) return Promise.reject(err);
            console.log('[DB Reset][mailgroup] drop old collection success.');
          });
        }
        return Promise.resolve(DB);
      })
      return checkCollectionExist;
    })
    .then((DB) => 
      new Promise((resolve, reject) => {
        DB.createCollection(collectionName, (err, collection) => {
          if(err) reject(err);
          console.log('[DB Reset][mailgroup] create collection success.')
          resolve({DB, collection});
        })
      })
    )
    .then((R) => {
      let dataset = getTestData();
      R.collection.insertMany(dataset, (err, result) => {
        if(err) return Promise.reject(err);
        //console.log(result);
        console.log('[DB Reset][mailgroup] insert data success.');
        
        R.DB.close();
        console.log('[DB Reset][mailgroup] reset success!');
      });
    })
    .catch((err) => console.log(err));
}

initial();