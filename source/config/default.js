module.exports = {
  //domain: "http://familytree.org/",
  domain: "https://a-tree-growing-up.herokuapp.com/",
  qrcodeAPI: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=',
  googleShortenUrlAPI: "https://www.googleapis.com/urlshortener/v1/url?key=",
  fgUrlRoot: "/fg/",
  tmpDir: __dirname+"/../../tmp/",
  autoSendCheckTime: 1000*60*10
};