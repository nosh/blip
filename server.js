var http = require('http');
var https = require('https');
var path = require('path');
var connect = require('connect');
var serveStatic = require('serve-static');

var config = require('./config.server.js');

var buildDir = 'dist';

var app = connect();

var staticDir = path.join(__dirname, buildDir);
app.use(serveStatic(staticDir));

// If no ports specified, just start on default HTTP port
if (!(config.httpPort || config.httpsPort)) {
  config.httpPort = 3000;
}

if (config.httpPort) {
  http.createServer(app).listen(config.httpPort, function() {
    console.log('Connect server started on port', config.httpPort);
    console.log('Serving static directory "' + staticDir + '/"');
  });
}

if (config.httpsPort) {
  https.createServer(config.httpsConfig, app).listen(config.httpsPort, function() {
    console.log('Connect server started on HTTPS port', config.httpsPort);
    console.log('Serving static directory "' + staticDir + '/"');
  });
}

if (config.discovery && config.publishHost) {
  var hakken = require('hakken')(config.discovery).client();
  hakken.start();

  var serviceDescriptor = {service: config.serviceName};

  if (config.httpsPort) {
    serviceDescriptor.host = config.publishHost + ':' + config.httpsPort;
    serviceDescriptor.protocol = 'https';
  }
  else if (config.httpPort) {
    serviceDescriptor.host = config.publishHost + ':' + config.httpPort;
    serviceDescriptor.protocol = 'http';
  }

  console.log('Publishing to service discovery: ',serviceDescriptor);
  hakken.publish(serviceDescriptor);
}
