/**
 * NodeJS Firehose Streaming Server configuration.
 *
 * @author Brian Sanderson (bsanders@adobe.com)
 */

// TODO: Fill this file in with your credentials and preferred settings.

var config = {}

// Global configuration
config.websocketPort =           9871
config.debug =                   true

// "test" environment configuration.
// You don't need to fill this in, unless you have a separate test credentials.
config.test = {}
config.test.username =           "me@example.com"             // adobe ID username
config.test.password =           "123456789"                  // adobe ID password
config.test.clientId =           "my-app-client"
config.test.clientSecret =       "14f323e5c8fff133fc12"
config.test.tokenApiHost =       "api.omniture.com"
config.test.trustAllSSLCerts =   true
config.test.streamUrl =          "https://firehose1.omniture.com/api/0/stream/my-test-stream"
config.test.tokenCacheFile =     "firehose-test.token"
config.test.maxConnections =     1

// "prod" environment configuration. Prod is the default environment.
// If you only have one environment, just fill this out.
config.prod = {}
config.prod.username =           "me@example.com"             // adobe ID username
config.prod.password =           "123456789"                  // adobe ID password
config.prod.clientId =           "my-app-client-prod"
config.prod.clientSecret =       "7a2200c5a3ddd821fc15"
config.prod.tokenApiHost =       "api.omniture.com"
config.prod.trustAllSSLCerts =   true
config.prod.streamUrl =          "https://firehose1.omniture.com/api/0/stream/my-prod-stream"
config.prod.tokenCacheFile =     "firehose-prod.token"

module.exports = config
