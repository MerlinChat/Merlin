
var nxb    = require("node-xmpp-bosh");
var http = require("http"),
	fs = require("fs"),
	path = require("path"),
	url = require('url'),
	mime = require("mime"),
	cache = {},
	port=3000;

var resp404 = function(response , textOnly) {
	filePath = "pages/404.html"
	if(!textOnly) {
		fs.exists(filePath , function(exists) {
			if(exists) {

				respFile(response , filePath, 404)
			} else {
				respError(response , 404);
			}
		})

	} else {
		respError(response , 404)
	}
}
var respError = function (response , status , message) {
	if( !status ) {
		status=403;
	}
	if( !message ) {
		message= status + ' Error'
	}
	response.writeHead(status,{ 'Content-Type' : 'text/plain' });
	response.write(message);
	response.end();
}
var renderFile = function(response, file, fileContents , status) {

	if ( !status ) {
		status=200;
	}
	mimel=mime.lookup(file);
	response.writeHead(status, {"Content-Type" : mimel });
	response.write(fileContents);
	response.end();
}

var respFile=function(response, filePath, status) {
	fs.readFile(filePath , function(err,data) {
		if( err ) {
			resp404(response , true);
		} else {
			renderFile(response, filePath, data, status)
		}
	})
}

var server = http.createServer( function( request, response)  {
	console.log("Request recieved for file: "+ request.url)
	var filePath = false
	var url_parts = url.parse(request.url);
	filePath=url_parts.pathname;

	if(filePath == "/" ) {
		filePath = "public/index.html";
	} else {
		filePath = "public/" + filePath;
	}
	fs.exists(filePath , function(exists) {
		if(exists) {
			respFile(response , filePath, 200)
		} else {
			resp404(response);
		}
	})
});

console.log("Starting BOSH on port 5280 ");
var bosh_server = nxb.start_bosh();
var port = 3000
if(process.argv[2]) {
	port = Number(process.argv[2]);
}

server.listen(port, function() {
	console.log("Server listening on port" + port );
});
