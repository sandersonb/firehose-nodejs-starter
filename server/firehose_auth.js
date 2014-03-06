
var https = require("https"),
	querystring = require("querystring"),
	fs = require("fs");

/**
 * Constructs a new FirehoseAuth object.
 *
 * @param config (object) object containing configuration data from config.js
 */
function FirehoseAuth(config) {
	this.config = config;
	this.tokenCacheFile = config.tokenCacheFile;
	this.token = null;
	this.readCachedToken();
}

/**
 * Builds the authenticaton request HTTP options
 *
 * @return (object) 
 */
FirehoseAuth.prototype.buildRequestOptions = function() {
	var options = {
		hostname: this.config.tokenApiHost,
		port: 443,
		path: '/token',
		method: 'POST',
		auth: this.config.clientId + ":" + this.config.clientSecret,
		rejectUnauthorized: !this.config.trustAllSSLCerts,
		requestCert: false,
		agent: false,
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		}
	};
	return options
};

/**
 * Attempts to read the token from the filesystem.
 *
 * @return (boolean) true if successfully loaded.
 */
FirehoseAuth.prototype.readCachedToken = function() {
	var data = ''
	try {
		data = fs.readFileSync(this.tokenCacheFile)
		if (data.length < 20) { 
			console.log("Cached token was not long enough (expected 20 bytes), discarding.")
		} else {
			console.log("Successfully read token from cache.");
			this.token = data
			return true
		}
	} catch (err) {
		console.log("Cached token file could not be found or wasn't readable. " + err)
	}
	return false
};

/**
 * Persists the obtained token to the filesystem.
 */
FirehoseAuth.prototype.writeTokenToCache = function() {
	var tokenCacheFile = this.tokenCacheFile;
	fs.writeFile(tokenCacheFile, this.token, function (err) {
		if (err) {
			console.log("Cached token file could not be created or overwritten. " + err)
		} else {
			console.log("Successfully wrote cached token to " + tokenCacheFile)
		}
	});
};

/**
 * getToken() requests a token from the token service, reading from cache for efficiency. 
 *
 * @param forceRefresh (boolean) if true, get a new token, no matter if one is already cached.
 * @param callback (callback) this will be called with success or error auth events.
 *   The callback should take two arguments: (token, err). If successful, the token contains
 *   the cached or requested token, and err is false. On failure, token is null, and err contains
 *   a string with the reason for the failure.
 */
FirehoseAuth.prototype.getToken = function(forceRefresh, callback) {
	if (this.token == null || forceRefresh) {
		this.requestToken(callback)
	}
	if (callback) {
		callback(this.token, false);
	}
}

/**
 * Requests a new token, responding on the callback when complete.
 * Use getToken() instead of calling this function directly.
 *
 * @param callback (callback). @see getToken().
 */
FirehoseAuth.prototype.requestToken = function(callback) {
	var options = this.buildRequestOptions(),
		buffer = '',
		authpost = querystring.stringify({
			'grant_type': 'password',
			'username': this.config.username,
			'password': this.config.password
		}),
		req = null,
		auth = this;

	console.log('Authenticating with ' + options.hostname + ' to obtain session token.');
	this.token = null; // clear out old token

	req = https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			buffer += chunk
		});
	});
	req.on('close', function() {
		var authResult = null,
			reqError = null;
		if (buffer == '') {
			reqError = 'Did not receive any output from token server.'
		} else {
			try {
				authResult = JSON.parse(buffer)
			} catch (err) {
				reqError = 'Could not parse JSON output ' + err
			}
			if (authResult && authResult.access_token) {
				auth.token = authResult.access_token;
				auth.writeTokenToCache()
			}
		}
		if (callback) {
			callback(auth.token, reqError != null ? reqError : false);
		}
	});
	req.on('error', function(e) {
		if (callback) {
			callback(null, "Got request serialization error: " + e);
		}
	});

	// write data to request body
	req.write(authpost)
	req.end();
};

/**
 * Invalidates the current token, presumably because it didn't authorize the request.
 */
FirehoseAuth.prototype.invalidateToken = function() {
	this.token = null;
}

module.exports = FirehoseAuth
