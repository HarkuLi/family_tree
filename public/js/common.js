/* -------------------------------------------------------------------------------------------  */
/* ------------------------------------- FUNCTION BLOCKS -------------------------------------  */
/* -------------------------------------------------------------------------------------------  */

/* TAG: Loading EJS Template */
function loadTemplate(route, data={}){
  return new Promise((resolve, reject) => {
    if(!route) reject(console.log("No Route Determinate."));

    // get template
    $.get(window.location.origin+route, data, (template, status) => {
      if(status === "error"){
        console.log({data, status});
        reject(console.log("Failed to Load Content."));
      }
      // rendering function with ejs template
      let render = ejs.compile(template, {client: true});
      resolve(render);
    }, "html");
  });
}

//TAG: cancel event default action and bubbling
function stopActionAndBubbling(e){
  e.stopPropagation();
  e.preventDefault();
}

//TAG: show and initial popup window
function showPopup(){
  $("#popup-content").html("");
  $(".mask").removeClass('hidden');
  $(".wrapper").removeClass('hidden');
  $("#async-load").removeClass('hidden');
}

//TAG: hide and reset popup window
function closePopup(){
  $(".mask").addClass('hidden');
  $(".wrapper").addClass('hidden');
  $("#async-load").addClass("hidden");
  $("#popup-content").html("");
}


// TAG: switch to signin or signup
function switchSignTo(e){
  $("form").submit((sub) => sub.preventDefault());
  stopActionAndBubbling(e);

  $("#async-load").removeClass("hidden");
  $("#popup-content").html("");

  let typeSet = {signin: "signin", signup: "signup"};
  if(!e.data.dest || !e.data.from) return console.log("switch input invalid.");
  if( !(e.data.dest in typeSet) || !(e.data.from in typeSet) ) return console.log("unknow switch type.");

  loadTemplate(`/mask/${e.data.dest}`)
    .then((render) => {
      $("#async-load").addClass("hidden");
      $("#popup-content").html(render());
    })
    // bind event: click
    .then(() => $("#switch-"+e.data.from).on("click", { dest: e.data.from, from: e.data.dest }, switchSignTo))
    .catch((err) => console.log(err));
}

// TAG: get all form input data and return json
function getFormSendData(id_selector){  // get data from form & process Array [{name: xxx, value: xxx}] to json
  let tmp = {};
  $(id_selector).serializeArray().forEach((nv) => tmp[nv.name] = nv.value);
  return JSON.stringify(tmp);
}

// TAG: send data to server
function sendDataToServer(method, sendUrl, sendData){
  if(!sendUrl || !sendData || !method) return Promise.reject("[common] sendDataToServer input invalid.");

  // send to server
  return Promise.resolve({ sendData, sendUrl })
    .then((obj) => {
      console.log(obj);
      return $.ajax({
        url: obj.sendUrl,
        method: method,
        contentType: 'application/json',
        data: obj.sendData,
        async: true,
        //dataType: 'json',
        success: (response, status, xhr) => Promise.resolve(response),
        error: (xhr, status, error) => Promise.reject(error)
      });
    })
    .catch((err) => Promise.reject(err));
}

/* --------------------------------------------------------------------------------------------  */
/* --------------------------------------- EVENT BLOCKS ---------------------------------------  */
/* --------------------------------------------------------------------------------------------  */

// TAG: mask show, signin show
$("#sign").click(() => {
  showPopup();
  loadTemplate("/mask/signin")
    .then((render) => {
      $("#async-load").addClass("hidden");
      $("#popup-content").html(render());
    })
    // bind event: switch to signup
    .then(() => $("#switch-signup").on("click", { dest: "signup", from: "signin" }, switchSignTo))
    .catch((err) => console.log(err));
});

// TAG: mask hide when click close
$("#sign_out").click(()=>{
  window.location = "/sign_out";
});

// mask hide when click close
$(".close").click(() => closePopup());

// TAG: get QR Code
$("#get-qrcode").click((e) => {
  stopActionAndBubbling(e);
  showPopup();

  loadTemplate("/mask/qrcode", {})
    .then((render) => {
      $("#async-load").addClass('hidden');
      $("#popup-content").html(render());
    })
    .then(() => 
      // bind event: copy short url
      $("#copy-url").on("click", () => {
        $("#short-url").select();
        document.execCommand("copy");
        $("#copy-url button").html("Copied");
        $(".info-text").html("Copied to Clipboard!");
      })
    ).catch((err) => console.log(err));
});