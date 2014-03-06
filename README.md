firehose-nodejs-starter
=======================

Firehose and NodeJS are natural friends due to the tools available in NodeJS to perform stream processing. This starter project:
- Requests a token as needed from the token server. Will re-request tokens as they expire.
- Caches tokens on the filesystem, so tokens can be reutilized.
- Connects (and reconnects) to the firehose streaming server as needed.
- Provides a callback (onDataReceived) that is executed everytime an object is received from the firehose.

Prerequisites
========================
- NodeJS >= 0.10
  - event-stream
  - socket.io
- A webserver to host client files.

Install these prerequisites using the npm tool: 

```
npm install event-stream
npm install socket.io
```
