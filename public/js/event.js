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

// mask show
$("#sign").click(() => {
  loadTemplate("/mask/signin")
    .then((render) => {
      // for testing async loading svg
      setTimeout(() => {
        $("#popup-content").html(render());
      }, 2000);

      $(".mask").removeClass('hidden');
      $(".wrapper").removeClass('hidden');
    }).catch((err) => {
      console.log(err);
    });
});

// mask hide
$(".close").click(() => {
  $(".mask").addClass('hidden');
  $(".wrapper").addClass('hidden');
  loadTemplate("/mask/load")
    .then((render) => {
      $("#popup-content").html(render());
    }).catch((err) => {
      console.log(err);
    });
});