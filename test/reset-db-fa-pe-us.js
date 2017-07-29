var Mongo = require('mongodb'); //for ObjectId()
var MongoClient = require('mongodb').MongoClient;

var dbUrl = "mongodb://localhost:3000/familytree";
var colle_family = 'family';
var colle_person = 'person';
var colle_user = 'user';

/** public function */
var getDB = MongoClient.connect(dbUrl);
var p_colle, f_colle, u_colle;

getDB
  .then((db)=>{
    p_colle = db.collection(colle_person);
    f_colle = db.collection(colle_family);
    u_colle = db.collection(colle_user);
    return p_colle.drop();
  })
  .catch((e)=>{
    console.log(e);
  })
  .then(()=>{
    return f_colle.drop();
  })
  .catch((e)=>{
    console.log(e);
  })
  .then(()=>{
    return u_colle.drop();
  })
  .catch((e)=>{
    console.log(e);
  })
  .then(()=>{
    return f_colle.insertOne({
      "_id" : Mongo.ObjectId("596da10db6caf43f6d67d56c"),
      "name" : "family1",
      "orderArray" : [ 1, "596d9a8af47458691441bb5a",
                       2, "596d9afdf47458691441bb5b", "596d9b0bf47458691441bb5c",
                       3, "596d9bb6f47458691441bb5d", "596d9bbff47458691441bb5e", "5971d6838ca8575082a48240" ],
      "usr" : "user1",
      "createTime" : 1501144961
    });
  })
  .then(()=>{
    return p_colle.insertOne({
      "_id" : Mongo.ObjectId("596d9a8af47458691441bb5a"),
      "name" : "name0",
      "email" : "name0@gmail.com",
      "children" : ["596d9afdf47458691441bb5b", "596d9b0bf47458691441bb5c"]
    });
  })
  .then(()=>{
    return p_colle.insertOne({
      "_id" : Mongo.ObjectId("596d9afdf47458691441bb5b"),
      "name" : "name1",
      "email" : "name1@gmail.com",
      "parents" : [ "596d9a8af47458691441bb5a" ],
      "children" : ["596d9bb6f47458691441bb5d", "596d9bbff47458691441bb5e"]
    });
  })
  .then(()=>{
    return p_colle.insertOne({
      "_id" : Mongo.ObjectId("596d9b0bf47458691441bb5c"),
      "name" : "name2",
      "email" : "name2@gmail.com",
      "parents" : [ "596d9a8af47458691441bb5a" ],
      "children" : ["5971d6838ca8575082a48240"]
    });
  })
  .then(()=>{
    return p_colle.insertOne({
      "_id" : Mongo.ObjectId("596d9bb6f47458691441bb5d"),
      "name" : "name3",
      "email" : "name3@gmail.com",
      "parents" : [ "596d9afdf47458691441bb5b" ]
    });
  })
  .then(()=>{
    return p_colle.insertOne({
      "_id" : Mongo.ObjectId("596d9bbff47458691441bb5e"),
      "name" : "name4",
      "email" : "name4@gmail.com",
      "parents" : [ "596d9afdf47458691441bb5b" ]
    });
  })
  .then(()=>{
    return p_colle.insertOne({
      "_id" : Mongo.ObjectId("5971d6838ca8575082a48240"),
      "name" : "name5",
      "email" : "name5@gmail.com",
      "parents" : [ "596d9b0bf47458691441bb5c" ]
    });
  })
  .then(()=>{
    return u_colle.insertOne({
      "_id" : Mongo.ObjectId("597996520e59cb204a4c8d04"),
      "usr" : "user1",
      "pw" : "$2a$13$Z0zhUDddfaaXpShUMH2jp.cOlrBL8Mn1HbP08l8FglUUGEp8Zhci6"
    });
  })
  .then(()=>{
    return getDB;
  })
  .then((db)=>{
    db.close();
  });