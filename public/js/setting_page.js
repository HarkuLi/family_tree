// TAG: export file 
/* function exportFile(e){
  stopActionAndBubbling(e);
  
  let sendData = getFormSendData("#ExportForm");
  let sendUrl = window.location.origin+'/transport/export';

  sendDataToServer('POST', sendUrl, sendData)
    .then((response) => {
      console.log(response);
      // FIXME: => DEPRECATED: because of inability with custom filename and compatibility of browsers
      window.location = "data:application/octet-stream," + encodeURIComponent(response);
      alert('Export data success!');
    })
    .catch((err) => {
      alert('Export data error!');
      console.log(err);
    });
} */

// TAG: import file
function importFile(e){
  stopActionAndBubbling(e);

  // TODO: get input's selected file
  // use .get() to return first match DOM and get the files attribute (FileList Web API)
  let selectedFile = $("#ImportTreeFile").get(0).files[0];
  if(!selectedFile) return alert("Please Choose an file.");

  // check file type is txt
  if(selectedFile.type !== "text/plain"){
    return alert("Error Data Type.\nPlease Choose export-xxx.txt file.");
  }

  // warning window
  let warnning = confirm("This operation will OVERWRITE ALL CURRENT DATA.\nWould you want to continue ?");
  if(!warnning) return;

  // get file content
  let fileReader = new FileReader();
  fileReader.readAsText(selectedFile);
  fileReader.addEventListener('loadend', function(e){
    if(this.error){
      alert("Load file content got error.");
      return console.log(this.error);
    }
    if(!this.result) return alert("Load empty file content.");

    // Send File Content as Data Url
    let sendData = JSON.stringify({file: this.result});
    let sendUrl = window.location.origin+'/transport/import';

    sendDataToServer('POST', sendUrl, sendData)
      .then((response) => {
        // {response, status}
        if(!response.status) return Promise.reject(response);
        alert('Import data success!');
        //window.location.reload();
      })
      .catch((err) => {
        err = JSON.parse(err.responseText);
        let msg = err.message || 'Import data error!';
        alert(msg);
        //console.log(err);
      });
    })
}

$("#ImportForm").on('submit', (e) => importFile(e));