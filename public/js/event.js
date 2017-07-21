/* Loading EJS Template */
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

// switch to signin or signup
function switchSignTo(e){
  $("form").submit((sub) => sub.preventDefault());
  e.stopPropagation();
  e.preventDefault();

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
    .then(() => {
      // bind event: click
      $("#switch-"+e.data.from).on("click", { dest: e.data.from, from: e.data.dest }, switchSignTo);
    })
    .catch((err) => console.log(err));
}

// mask show, signin show
$("#sign").click(() => {
  $("#popup-content").html("");
  $(".mask").removeClass('hidden');
  $(".wrapper").removeClass('hidden');
  $("#async-load").removeClass('hidden');

  loadTemplate("/mask/signin")
    .then((render) => {
      $("#async-load").addClass("hidden");
      $("#popup-content").html(render());
    })
    .then(() => {
      // bind event: switch to signup
      $("#switch-signup").on("click", { dest: "signup", from: "signin" }, switchSignTo);
    }).catch((err) => console.log(err));
});

// mask hide when click close
$(".close").click(() => {
  $(".mask").addClass('hidden');
  $(".wrapper").addClass('hidden');
  $("#async-load").addClass("hidden");
  $("#popup-content").html("");
});

// get QR Code
$("#get-qrcode").click((e) => {
  let test_fgid = '6a736e667061693132396664';

  // cancel a event bubling
  e.stopPropagation();
  e.preventDefault();

  $("#popup-content").html("");
  $(".mask").removeClass('hidden');
  $(".wrapper").removeClass('hidden');
  $("#async-load").removeClass('hidden');

  loadTemplate("/mask/qrcode", { fgid: test_fgid })
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