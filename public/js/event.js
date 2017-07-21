/* Loading EJS Template */
function loadTemplate(route){
  return new Promise((resolve, reject) => {
    if(!route) reject(console.log("No Route Determinate."));

    // get template
    $.get(window.location.origin+route, {}, (template, status) => {
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

// switch to signin or signup
function switchSignTo(e, type){
  e.stopPropagation();
  e.preventDefault();

  switch(type){
    case "signin":  
      let target = "signin";
      let origin = "signup"; 
      break;
    case "signup":  
      let target = "signup";
      let origin = "signin"; 
      break;
    default:  
      return console.log("unknow switch type.");
  }

  loadTemplate("/mask/load")
    .then((render) => $("#popup-content").html(render()))
    .then(() => loadTemplate(`/mask/${target}`))
    .then((render) => $("#popup-content").html(render()))
    .then(() => {})
    .catch((err) => console.log(err));

    // bind event: click
    $("#switch-"+origin).on("click", switchSignTo(e, origin));
}

// mask show, signin show
$("#sign").click(() => {
  loadTemplate("/mask/signin")
    .then((render) => $("#popup-content").html(render()))
    .then(() => {
      // bind event: switch to signup
      $("#switch-signup").on("click", switchSignTo);
    
      $(".mask").removeClass('hidden');
      $(".wrapper").removeClass('hidden');
    }).catch((err) => console.log(err));
});

// mask hide
$(".close").click(() => {
  $(".mask").addClass('hidden');
  $(".wrapper").addClass('hidden');
  loadTemplate("/mask/load")
    .then((render) => $("#popup-content").html(render()))
    .catch((err) => console.log(err));
});

// get QR Code
$("#get-qrcode").click((e) => {
  // cancel a event bubling
  e.stopPropagation();
  e.preventDefault();

  loadTemplate("/mask/qrcode")
    .then((render) => $("#popup-content").html(render()))
    .then(() => {
      // bind event: copy short url
      $("#copy-url").on("click", () => {
        $("#copy-url button").html("Copied");
        $(".info-text").html("Copied to Clipboard!");
      });
      $(".mask").removeClass('hidden');
      $(".wrapper").removeClass('hidden');
    }).catch((err) => console.log(err));
});

