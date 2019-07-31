var querystring = require('querystring');
const https = require('https');
const logger = require('./logger.service.js');

/**
 * getJSON:  RESTful GET request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */

module.exports.getJSON = (options, onSuccess, onError) => {
  let output = '';

  const req = https.request(options, (res) => {
    res.setEncoding('utf8');

    res.on('data', (chunk) => {
      output += chunk;
    });

    res.on('end', () => {
      logger.logApiCall(options.host + options.path, null, res.statusCode);
      let data = JSON.parse(output);
      //console.log(`resp: (${res.statusCode})\n\n${JSON.stringify(data)}`);
      if (res.statusCode >= 200 && res.statusCode <= 299)
        onSuccess(data, res.statusCode);
      else 
        console.error(data.error);
        onError(data.error, res.statusCode);
    });

    req.on('error', (err) => {
      logger.logApiCall(options.host + options.path, err, res.statusCode);
      onError(err, res.statusCode);
    });
  });

  req.end();
};