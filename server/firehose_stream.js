/**
 * Firehose Stream.
 *
 * Reads the firehose stream and emits data over a callback.
 * Handles reconnect and reauthentication.
 *
 * @author (bsanders@adobe.com)
 */

var https = require('https'),
	es = require('event-stream'),
	zlib = require('zlib'),
	url = require('url');

/**
 * Constructs a new FirehoseStream.
 *
 * @param auth (FirehoseAuth)
 * @param config (Object)
 * @param dataCB (callback) calls will be made to this callback when data
 *   data is received from the firehose, and when errors occur. The callback
 *   should take two parameters: data and err. If successful, data should be an Object,
 *   and err should be null. If error, data will be null and err will contain an 
 *   error message describing the failure.
 */
function FirehoseStream(auth, config, dataCB) {
	this.auth = auth
	this.config = config;
	this.dataCB = dataCB;
	this.request = null;
	this.dead = false;
	this.authRunning = false;
}

/**
 * Ensures that this firehose stream is running. Will only
 * establish a connection if one is not already in progress.
 */
FirehoseStream.prototype.run = function() {
	if (!this.dead) {
		if (this.auth.token == null && !this.authRunning) {
			this.startAuthentication(false);
		} else if (this.auth.token != null && this.request == null) {
			this.startStreaming();
		}
	}
}

/**
 * Starts the authentication process and registers a callback.
 * If successful, the startStreaming() function is called.
 */
FirehoseStream.prototype.startAuthentication = function(forceRefresh) {
	var stream = this;
	this.authRunning = true;
	this.auth.getToken(forceRefresh ? true : false, function(token, err) {
		this.authRunning = false;
		if (err) {
			stream.die();
			stream.dataCB(null, "Got error from token authentication: " + err);
		} else {
			stream.startStreaming();
		}
	});
}

/**
 * Starts the streaming process and registers callbacks. When data
 * is received, it is emitted via the dataCB member.
 */
FirehoseStream.prototype.startStreaming = function() {
	var options = this.buildRequestOptions(),
		stream = this;
	this.request = https.request(options, function(response) {
		if (response.statusCode == 200) { // OK
			console.log("Successfully connected to stream. Receiving data.")
			response.pipe(zlib.createGunzip())
			.pipe(es.split())
			.pipe(es.parse())
			.pipe(es.map(function(data, cb) {
				stream.dataCB(data, null); 
			}));
		} else if (response.statusCode == 401) { // unauthorized
			stream.auth.invalidateToken()
			stream.dataCB(null, 'Got stream unauthorized, will try to authenticate.');
		} else if ((response.statusCode == 301 ||
			    response.statusCode == 302) &&
			    response.headers.location) { // redirect
			console.log('Redirecting to: ' + response.headers.location)
			stream.config.streamUrl = response.headers.location
			stream.config.maxConnections = null
		} else {
			stream.die();
			stream.dataCB(null, 'Got an unexpected HTTP status ' + response.statusCode + ', aborting.');
		}
	});
	this.request.on('close', function() {
		stream.request = null;
		stream.dataCB(null, 'Stream disconnected. Will attempt reconnect.')
	});
	this.request.end()
}

/**
 * Marks the stream as dead, and will not try to restart it.
 */
FirehoseStream.prototype.die = function() {
	this.dead = true
}

/**
 * Builds HTTP request options. 
 *
 * @return (object)
 */
FirehoseStream.prototype.buildRequestOptions = function() {
	var firehoseUrl = this.config.streamUrl;
	if (this.config.maxConnections) {
		firehoseUrl += "?maxConnections=" + this.config.maxConnections 
	}
	var options = url.parse(firehoseUrl)
	options.headers = {
		'Authorization': 'Bearer ' + this.auth.token,
	    'Accept-Encoding': 'gzip'
	};
	return options;
}

module.exports = FirehoseStream;
