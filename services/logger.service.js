const ApiLog = require('../models/apilog.model.js');

/**
 * getJSON:  log api call
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */

module.exports.logApiCall = (url, error, statusCode) => {
  const logItem = new ApiLog({
      url: url,
      status: statusCode,
      time: new Date().toLocaleString(),
      err: error
  });

  // Save HourlyPriceHistory in the database
  logItem.save().then(data => {
    console.log(`Successfully logged api-call to url ${url}`)
  }).catch(err => {
      console.error(err.message + " Some error occurred while saving in api-log.");
  });
};