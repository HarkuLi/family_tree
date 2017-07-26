var passData = (obj)=>{
  return new Promise((resolve, reject)=>{
    $.post("/signup_action", obj, (data, status)=>{
      if(status !== "success")  return reject("post status: "+status);
      resolve(data.rst);
    });
  });
}   

var signup_action = ()=>{
  var input = document.getElementById("signup_form").getElementsByTagName("input");
  var req_obj = {};

  for(let ele of input){
    req_obj[ele.name] = ele.value;
    if(!ele.value.length)
      return alert("You haven't filled all fields.");
  }
  if(req_obj.re_pw !== req_obj.pw)
    return alert("The retyped password doesn't match to the password.");
  delete req_obj.re_pw;
  document.body.style.cursor = "progress";
  passData(req_obj)
    .then((rst)=>{
      if(rst){
        alert("Create account successfully, please log in with your account.");
        document.body.style.cursor = "";
        $("#switch-signin").click();  //go to login page
      }
      else{
        alert("Repeated user name.");
        document.body.style.cursor = "";
      }
    });
}