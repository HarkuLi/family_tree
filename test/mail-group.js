const MailGroup = require('../source/lib/controllers/mail-group');
const ObjectID = require('mongodb').ObjectID;

MailGroup.getGroupList('597c823745869057253c7880')
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  }); 

/* MailGroup.getGroup('597afeddacd3e260b5235ed3')
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  }); */

// test for add
/* console.log("<test for add group>")
MailGroup.putGroup(null, {name: "test-group-100"})
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  }); */

/* console.log("<test for update group>")
MailGroup.putGroup("597c689a7154d525106c4840", {name: "hehehehe"})
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  }); */

/* console.log("<test for insert member>");
MailGroup.putGroupMember('597c689a7154d525106c4840', {addName: "GGGGGy", addEmail: "ggg@gg.com"})
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  }); */

/* console.log("<test for insert member>");
MailGroup.putGroupMember('597c689a7154d525106c4840', {addPid: "5971d6838ca8575082a48240"})
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  }); */   

/* console.log("<test for delete member>");
MailGroup.deleteGroupMember('597c689a7154d525106c4840', "597c6a29aa3de928d70dc2b0")
  .then((v) => {
    console.log(v);
    console.log('test success');
  })
  .catch((e) => {
    console.log(e);
    console.log('test failed');
  });    */