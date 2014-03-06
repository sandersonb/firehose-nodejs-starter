/**
 * Starter NodeJS Firehose Consumer. Emits browser data over
 * websockets.
 *
 * TODO: Make sure to edit the config.js file first!
 *
 * @author Brian Sanderson (bsanders@adobe.com)
 */

var http = require("http"),
	util = require("util"),
	socketio = require("socket.io"),
	fullConfig = require("./config"),
	FirehoseAuth = require("./firehose_auth"),
	FirehoseStream = require("./firehose_stream");

var environ = "prod",
	config = fullConfig[environ],
	auth = null,
	stream = null,
	app = http.createServer(function() {}),
	io = socketio.listen(app),
	browsers = {}; // object that will collect results from firehose

io.set('log level', 1);

// Process command line arguments
process.argv.forEach(function(val, index, array) {
	if (val.indexOf("env=") == 0) {
		environ = val.substring(4)
		config = fullConfig[environ]
	}
});
		
// Make sure we have a valid config
if (!fullConfig[environ]) {
	console.log("Could not find " + environ + " environment in config.js") 
	process.exit(1);
}

// This is the data received callback, which will get called
// everytime a row is received from the firehose.
//
function onDataReceived(data, err) {
	if (err != null) {
		// There was an error. Print it out and quit if the stream is dead.
		console.log(err);
		if (stream.dead) {
			process.exit(2);
		}
		// If it wasn't dead, it will get retried by the mainLoop.
	} else {
		// If you want to see the data, uncomment this.
		//console.log("Received data: " + util.inspect(data))
		
		// TODO: Process the data
		// Here is a simple example of extracting the browser column, and aggregating 
		// occurences of each browser.
		if (data.browser) {
			console.log("Got browser: " + data.browser);
			if (!browsers[data.browser]) {
				browsers[data.browser] = 0;
			}
			browsers[data.browser]++;
		}
	}
}

// Instantiate Firehose objects
auth = new FirehoseAuth(config);
stream = new FirehoseStream(auth, config, onDataReceived);

// Main program loop
function mainLoop() {
	if (stream.dead) {
		process.exit(2)
	}
	
	// If the stream disconnects or the token expires, run() ensures
	// that the stream gets re-authenticated and re-connected. Calling 
	// stream.run() multiple times will not make more than one connection.
	stream.run();

	// Push data out the connected websocket(s).
	io.sockets.emit('data', browsers);
}

// Run the mainLoop every second
setInterval(mainLoop, 1000);

// Have the websocket listen on the speciied websocketPort
app.listen(fullConfig.websocketPort);

