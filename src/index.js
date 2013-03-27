/* global onload: true */
/* global logger */

onload = function() {
  var start = document.getElementById("start");
  var stop = document.getElementById("stop");
  var hosts = document.getElementById("hosts");
  var port = document.getElementById("port");
  var directory = document.getElementById("directory");
  var staticDirectory = document.getElementById("static-directory");
  var htmlFileExtensions = document.getElementById("html-file-extensions");

  var socket = chrome.experimental.socket || chrome.socket;
  var socketInfo;
  var filesMap = {};
  var staticFilesMap = {};

  var stringToUint8Array = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for(var i = 0; i < string.length; i++) {
      view[i] = string.charCodeAt(i);
    }
    return view;
  };

  var arrayBufferToString = function(buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for(var s = 0; s < uArrayVal.length; s++) {
      str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
  };

  var logToScreen = function(log) {
    logger.textContent += log + "\n";
  };

  var writeErrorResponse = function(socketId, errorCode, keepAlive) {
    var file = { size: 0 };
    console.info("writeErrorResponse:: begin... ");
    console.info("writeErrorResponse:: file = " + file);
    var contentType = "text/plain"; //(file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 " + errorCode + " Not Found\nContent-length: " + contentLength +
      "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    console.info("writeErrorResponse:: Done setting header...");
    var outputBuffer = new ArrayBuffer(header.byteLength + contentLength);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);
    console.info("writeErrorResponse:: Done setting view...");
    socket.write(socketId, outputBuffer, function(writeInfo) {
      console.log("WRITE", writeInfo);
      if (keepAlive) {
        readFromSocket(socketId);
      } else {
        socket.destroy(socketId);
        socket.accept(socketInfo.socketId, onAccept);
      }
    });
    console.info("writeErrorResponse::filereader:: end onload...");

    console.info("writeErrorResponse:: end...");
  };

  var write200Response = function(socketId, file, keepAlive) {
    var contentType = (file.type === "") ? "text/plain" : file.type;
    if (file.name.lastIndexOf('.t') + 2 === file.name.length) {
      contentType = "text/html";
    }
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + contentLength +
      "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + contentLength);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);

    if (contentType == "text/html") {
      fileReader.onload = function(e) {
    	var html = e.target.results;  
    	var $ = cheerio.load(html);
    	var content = $('* [data-lift^="surround"]');
    	var contentValue = content.attributes['data-lift'].value;
    	var contentSurround = content.attributes['data-lift'].value.split('with=');
    	var contentSurroundWith = contentValue.split('with=')[1].split(';')[0]
    	var contentSurroundAt = contentValue.split('at=')[1].split(';')[0]

      };
      fileReader.readAsText(file);
    	
    } else {
      var fileReader = new FileReader();
      fileReader.onload = function(e) {
         view.set(new Uint8Array(e.target.result), header.byteLength); 
         socket.write(socketId, outputBuffer, function(writeInfo) {
           console.log("> ", file.webkitRelativePath);
           console.log("WRITE", writeInfo);
           if (keepAlive) {
             readFromSocket(socketId);
           } else {
             socket.destroy(socketId);
             socket.accept(socketInfo.socketId, onAccept);
           }
        });
      };
      fileReader.readAsArrayBuffer(file);
    };

  };

  var onAccept = function(acceptInfo) {
    console.log("ACCEPT", acceptInfo);
    readFromSocket(acceptInfo.socketId);
  };

  var readFromSocket = function(socketId) {
    //  Read in the data
    socket.read(socketId, function(readInfo) {
      console.log("READ", readInfo);
      // Parse the request.
      var data = arrayBufferToString(readInfo.data);
      if(data.indexOf("GET ") === 0) {
        console.log("< ", data);
        var keepAlive = false;
        if (data.indexOf("Connection: keep-alive") !== -1) {
          keepAlive = true;
        }

        // we can only deal with GET requests
        var uriEnd =  data.indexOf(" ", 4);
        if(uriEnd < 0) { /* throw a wobbler */ return; }
        var uri = data.substring(4, uriEnd);
        // strip query string
        var q = uri.indexOf("?");
        if (q !== -1) {
          uri = uri.substring(0, q);
        }
        var file = filesMap[uri] || staticFilesMap[uri];
        if(!!file === false) {
          file = staticFilesMap[uri];
        }
        if(!!file === false) { 
          console.warn("File does not exist..." + uri);
          writeErrorResponse(socketId, 404, keepAlive);
          return; 
        }
        logToScreen("GET 200 " + uri);
        write200Response(socketId, file, keepAlive);
      }
      else {
        // Throw an error
        socket.destroy(socketId);
      }
    });
  };

  directory.onchange = function(e) {
    if (socketInfo) {
      socket.destroy(socketInfo.socketId);
    }

    var files = e.target.files;

    for(var i = 0; i < files.length; i++) {
      //remove the first part of directory
      var path = files[i].webkitRelativePath;
      filesMap[path.substr(path.indexOf("/"))] = files[i];
    }

    start.disabled = false;
    stop.disabled = true;
    directory.disabled = true;
  };

  staticDirectory.onchange = function(e) {
    if (socketInfo) {
      socket.destroy(socketInfo.socketId);
    }

    var files = e.target.files;

    for(var i = 0; i < files.length; i++) {
      //remove the first part of directory
      var path = files[i].webkitRelativePath;
      staticFilesMap[path.substr(path.indexOf("/"))] = files[i];
    }

    start.disabled = false;
    stop.disabled = true;
    staticDirectory.disabled = true;
  };

  start.onclick = function() {
    socket.create("tcp", {}, function(_socketInfo) {
      socketInfo = _socketInfo;
      socket.listen(socketInfo.socketId, hosts.value, parseInt(port.value, 10), 50, function(result) {
        console.log("LISTENING:", result);
        socket.accept(socketInfo.socketId, onAccept);
      });
    });

    directory.disabled = true;
    staticDirectory.disabled = true;
    stop.disabled = false;
    start.disabled = true;
  };

  stop.onclick = function() {
    directory.disabled = false;
    staticDirectory.disabled = false;
    stop.disabled = true;
    start.disabled = false;
    socket.destroy(socketInfo.socketId);
  };

  socket.getNetworkList(function(interfaces) {
    for(var i in interfaces) {
      var intrface = interfaces[i];
      var opt = document.createElement("option");
      opt.value = intrface.address;
      opt.innerText = intrface.name + " - " + intrface.address;
      hosts.appendChild(opt);
    }
  });
};
