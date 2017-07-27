var dbop_tree = require("./dbop_tree");

/** convert order array to object array */
var orderArrayHandle = (OA)=>{
  var promise_chain = new Promise((resolve, reject)=>{
    var rst = [];
    resolve(rst);
  });

  for(let i=0; i<OA.length; ++i){
    if(Number(OA[i])){
      let gen_num = OA[i];    //number of a generation
      promise_chain = promise_chain
        .then((rst)=>{
          rst.push(gen_num);
          return rst;
      });
    }
    else{
      promise_chain = promise_chain
        .then((rst)=>{
          return dbop_tree.getPersonByID(OA[i])
            .then((item)=>{
              rst.push(item);
              return rst;
            });
        });
    }
  }
  return promise_chain;
};

module.exports = {orderArrayHandle};

/** test code */
// var OA = [1, "596d9a8af47458691441bb5a", 2, "596d9afdf47458691441bb5b", "596d9b0bf47458691441bb5c", 3, "596d9bb6f47458691441bb5d", "596d9bbff47458691441bb5e", "596d9bcaf47458691441bb5f"];

// orderArrayHandle(OA)
//     .then((rst)=>{
//         for(let ele of rst){
//             if(ele.name)    console.log(ele.name)
//             else    console.log(ele)
//         }
//         dbop_tree.getDB.then((db)=>{db.close()});
//     });
/** test code */