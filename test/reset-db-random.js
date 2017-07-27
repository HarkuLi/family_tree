'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const Connection = MongoClient.connect('mongodb://localhost:3000/familytree')
const collectionName = 'person';


function randomTestData(type){
  let count = Math.floor(Math.random()*5) + 5;
  let DataSet = [];

  for(let i = 0; i < count; ++i){
    
    DataSet.push(data);
  }
  console.log('[DB Reset][mailleter] generate new random test data success.');
  return DataSet;
}
// TAG:
function family(){
  
}

// TAG:
function person(){

}

// TAG:
function letter(i){
  let now = new Date().getTime();
  let data = {
    from: "einfachstudio@gmail.com",
    tags: [''],
    sendTime: now,
    createTime: now
  };

  // random content
  data.fgid = "6a736e667061693132396664";
  data.to = ["user1@domain.com", "user2@domain.com", "user3@domain.com", "user4@domain.com", "user5@domain.com"];
  data.subject = `Hello Work! Mail: ${i}`;
  data.content = "<h2>Hello Work!!</h2><br><img src=https://www.microsoft.com/zh-tw/CMSImages/WindowsHello_Poster_1920-1600x300-hello.png?version=0d8f51c7-ef87-b0af-8f26-453fb40b4b7d>";
  data.createTime = now;

  // random status
  let idx = Math.floor(Math.random()*5);
  data.status = statusList[idx];

  // fill response fields with status
  switch(idx){
    case 5, 4:
      data.sendTime = new Date().getTime();
      break;
    case 3:
      data.autoSend = false;
      data.reserveTime = new Date().getTime();
      break;
    case 2:
      data.autoSend = true;
      data.reserveTime = new Date().getTime() + 1000000;
      break;
    case 0:
      data.deprecateTime = new Date().getTime();
      break;
  }
    return 
}

// TAG:
function mailgroup(){

}

// TAG:
function user(){

}

function initial(type){
  console.log('[DB Reset][mailleter] start reset collection mailler.');
  Connection
    .then((DB) => {
      let checkCollectionExist = DB.listCollections().toArray().then((collecs) => {
        if(collecs.some((e) => e.name === collectionName)){
          DB.collection(collectionName).drop((err, result) => {
            if(err) return Promise.reject(err);
            console.log('[DB Reset][mailleter] drop old collection success.');
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
          console.log('[DB Reset][mailleter] create collection success.')
          resolve({DB, collection});
        })
      })
    )
    .then((R) => {
      let dataset = randomTestData(type);
      R.collection.insertMany(dataset, (err, result) => {
        if(err) return Promise.reject(err);
        //console.log(result);
        console.log('[DB Reset][mailleter] insert data success.');
        
        R.DB.close();
        console.log('[DB Reset][mailleter] reset success!');
      });
    })
    .catch((err) => console.log(err));
}

initial();