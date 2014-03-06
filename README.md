firehose-nodejs-starter
=======================

The Adobe Firehose and NodeJS are natural friends due to the tools available in NodeJS to perform stream processing. 
This starter project illustrates how to consume data from the Adobe Firehose. Specifically it:

- Requests a token as needed from the token server. Will re-request tokens as they expire.
- Caches tokens on the filesystem, so tokens can be reutilized.
- Connects (and reconnects) to the firehose streaming server as needed.
- Provides a callback (onDataReceived) that is executed everytime an object is received from the firehose.

### Prerequisites

- Have experience using the terminal on your platform.
- Obtain access to the Firehose
  - Have ready your Adobe ID
  - Generate a clientId and clientSecret
  - Obtain your Firehose endpoint URL. 
- NodeJS >= 0.10. Also requires packages:
  - event-stream
  - socket.io
- A webserver to host client files.

### Setup NodeJS

Visit http://nodejs.org/ to download NodeJS.

Once installed, install the needed packages using the npm tool: 

```
npm install event-stream
npm install socket.io
```

### Edit `config.js`

Edit `config.js` and fill in all the settings with your credentials. Most likely, you only have one
set of credentials. If this is the case, just fill out the "prod" section in `config.js`.

### Run server

Now you can run the server:

```
node server.js env=prod
```

It should negotiate a token with the Token API service, and begin consuming from the firehose. 
If an error occurs, determine if the error had to do with requesting the token, or if it had
to do with connecting to the firehose string. If the error deals with the token, double check your
credentials in `config.js`. If the problem is with connecting to the firehose stream server,
double check the streamUrl in `config.js`. If you get unauthorized problems at the firehose stream,
this probably means the stream is not configured for your user on the Adobe side, and you will need to reach out.

### Setup client

Copy the contents of the `client` directory inside the webroot of a running webserver. This can be Apache, nginx, or 
any other webserver. The only requirements are that your browser is able to create an http connection and negotiate a websocket with the running node server. Load `index.html` in your browser.

You should see a very basic table of data containing a count of browser types that have visited your site. If you see no errors but aren't getting data, add some more logging (`console.log`) to `server.js`.
