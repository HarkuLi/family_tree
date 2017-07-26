var passData = (obj)=>{
  return new Promise((resolve, reject)=>{
    $.post("/signin_action", obj, (data, status)=>{
      if(status !== "success")  return reject("post status: "+status);
      resolve(data.rst);
    });
  });
}

var signin_action = ()=>{
  var input = document.getElementsByTagName("input");
  var req_obj = {};
  document.getElementById("signin_msg").innerHTML = "";

  for(let ele of input){
    req_obj[ele.name] = ele.value;
    if(!ele.value.length){
      let msg = "You haven't filled all fields.";
      document.getElementById("signin_msg").innerHTML = msg;
      return;
    }
  }
  document.body.style.cursor = "progress";
  passData(req_obj)
    .then((rst)=>{
      if(rst){
        let form = document.getElementById("signin_form");
        let element = document.createElement("input");
        element.setAttribute("type", "hidden");
        element.setAttribute("name", "token");
        element.setAttribute("value", rst);
        form.appendChild(element);
        form.submit();
      }
      else{
        let msg = "Wrong user name or password.";
        document.getElementById("signin_msg").innerHTML = msg;
        document.body.style.cursor = "";
      }
    });
};