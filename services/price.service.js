const config = require('../config/config.js');
const PriceHistory = require('../models/price.model.js');
const httpService = require('./http.service.js');
var retryLeft = 0;
const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * init: Fetch price at regular intervals and store in db
**/
module.exports.init = () => {
  var immediateId = setImmediate(() => {
      retryLeft = config.coin_api.retries;
      //fetchAndStorePrice(); //Temporary comment, so as to avoid quota limit
  });

  //Call fetchAndStoreCurrentPrice after specified interval
  var intervalId = setInterval(() => {
      console.log('');
      console.log('');
      console.log(`Interval of ${config.interval_in_sec} elapsed. Fetching current-price`);
      retryLeft = config.coin_api.retries;
      fetchAndStorePrice();
  }, 1000 * config.interval_in_sec); 

  //Fill gaps in history
  if (config.load_previous){
    loadPrevious();
  }
}

/**
 * getPriceHistory:  Get price-history of given type
**/
module.exports.getPriceHistory = (req, res) => {
    // Date from which data shall be fetched
    var start = getStartDate(req.params.type);

    // Retrieve and return all priceHistory from the database.
    console.log(`Getting price history from ${start.toISOString()} for type ${req.params.type}`);
    PriceHistory.aggregate([
      { "$match": { time: { $gte: start } }   }, //only fetch data > start
      { "$group": {   //group data depending on type. E.g.: If type is year, then only last data will be fetched for each month
          "_id": {
            hour: (req.params.type=='day')? { $hour: "$time" }: undefined,
            day: (req.params.type=='day' || req.params.type=='month')?{ $dayOfMonth: "$time" }: undefined,
            month: { $month: "$time" },
            year: { $year: "$time" },
          },
          "data": { "$last": "$$ROOT" } 
      }},
      { $sort: { //sort in order of time
        '_id.year': 1, 
        '_id.month': 1, 
        '_id.day': 1,
        '_id.hour': 1
      }}
    ]).then(result => {
          console.log(`Received price-history ${JSON.stringify(result)}`);
          res.send(formatResponse(req.params.type, result));
      }).catch(err => {
          console.log(`Received price-history-error ${err}`);
          res.status(500).send({
              message: err.message
          });
      });
}

/**
 * fetchAndStorePrice:  Fetch price for given time by calling coinapi and store in db
 * @param [date]: Date for which price will be fetched
**/
fetchAndStorePrice = (date) => {
    const path = '/v1/exchangerate/' + config.from_currency + '/' + config.to_currency;
    const options = {
      host: config.coin_api.base_url,
      port: 443,
      path: (date)? path + '?time=' + date.toISOString(): path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CoinAPI-Key': config.coin_api.api_key
      }
    };

    if (!date){
      //Fetch current price
      console.log(`Fetching current price from: ${options.host}${options.path}`)
      httpService.getJSON(options, savePriceInHistory,
        (error, statusCode) => {
          //Check if we can retry on failure
          if (retryLeft > 0){
            fetchAndStoreCurrentPrice();
            retryLeft--;
          }
      }); 
    }
    else {
      // Check if priceItem already exists for given type 
      console.log(`Checking if price exists in history`);
      PriceHistory.find({ //Search options
            //from_curr: priceItem.from_curr, 
            //to_curr: priceItem.to_curr,
            //hour: date.getHours(),
            date: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear()
          }, { val: 1, _id: 0 } ) //Columns to fetch 
      .then(result => {
          if (result.length == 0){
            // Save HourlyPriceHistory in the database
            console.log(`Price-history doesnt exist. Fetching price from: ${options.host}${options.path}`)
            httpService.getJSON(options, savePriceInHistory,
              (error, statusCode) => {
                //Check if we can retry on failure
                if (retryLeft > 0){
                  fetchAndStoreCurrentPrice();
                  retryLeft--;
                }
            }); 

          }
          else {
            console.log(`Price-history is already present`);
          }
      }).catch(err => {
          console.error(err.message + " Some error occurred while saving the PriceHistory.");
      });
    }
    
}

/**
 * saveCurrentPrice:  Save current price in database
 * @param data: Price data received by coinapi
**/
savePriceInHistory = (data) => {
  // Build priceItem to be saved
  const time = new Date(data.time);
  const priceItem =  new PriceHistory({
                          val: data.rate,
                          time: time,
                          from_curr: config.from_currency,
                          to_curr: config.to_currency,
                          hour: time.getHours(),
                          date: time.getDate(),
                          month: time.getMonth(),
                          year: time.getFullYear()
                      });
  
  // Save HourlyPriceHistory in the database
  console.log(`Saving price in history as ${priceItem}`);
  priceItem.save().then(data => {
        console.log(`Successfully saved price`)
  }).catch(err => {
    console.error(err.message + " Some error occurred while saving the PriceHistory.");
  });
}

/**
  format chart response
**/
formatResponse = (type, result) => {
    var categories = [];
    var data = [];
    for (var i = 0; i < result.length; i++) {
        var id = result[i]._id;
        if (type == 'day' && id.hour%2 != 0){
          continue; //every 2h
        }
        else if (type == 'month' && id.day%3 != 0){
          var today = new Date();
          var lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0);
          if (id.day != lastDay.getDate() && id.day != 1){ //dont ignore first and last day
            continue; //every 3d  
          }
        }
        else if (type == 'all' && (id.month-1)%3 != 0){
          continue; //every 3month starting from 0 //1, 4, 7, 10
        }
        var priceHistory = result[i].data;
        categories.push(getPriceLabel(type, priceHistory.time, (i == 0)));
        data.push(priceHistory.val);
    }

    return {
        categories: categories,
        data: data,
        fromCurrency: config.from_currency,
        targetCurrency: config.to_currency,
        fromCurrencyName: config.from_currency_name, //temp
        targetCurrencyName: config.to_currency_name
    };
}

/**
  Get display label for x-axis
**/
getPriceLabel = (type, time, isFirst) => {
    var label = '';
    var date = new Date(time);
    var months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];//month names
    
    switch(type){
        case 'day':
            label = date.getHours() + 'h';
            break;
        case 'month':
            label = date.getDate();
            var today = new Date();
            if (date.getDate() == today.getDate() &&
                  date.getMonth() == date.getMonth() &&
                  date.getFullYear() == date.getFullYear()){
              label = "hoy"; //today
            }
            break;
        case 'year':
            label = months[date.getMonth()];
            break;
        case 'all':
            if (isFirst)
              label = months[date.getMonth()] + ' ' + date.getFullYear(); //first entry in chart
            else if (date.getMonth() >= 0 && date.getMonth() <= 2)
              label = date.getFullYear(); //starting month -- show year
            else 
              label = months[date.getMonth()]; //show month 
            break;
        default:
            throw "Invalid type " + type;
    }
    return label + "";
}

/**
* Get date from which data should be fetched for input time param
**/
getStartDate = (typeParam) => {
    var start = new Date();
    
    switch(typeParam){
        case 'day':
            start.setDate(start.getDate() - 1); //get records of past day
            break;
        case 'month':
            start.setMonth(start.getMonth() - 1); //get records of past month
            break;
        case 'year':
            start.setYear(start.getFullYear() - 1); //get records of past year
            break;
        case 'all':
            start.setYear(start.getFullYear() - 3); //get records of past 3 years
            break;
        default:
            throw "Invalid type: " + typeParam;
    }
    return start;
}

/**
* Loading previous data
**/
loadPrevious = () => {
  var currDate = new Date();
  var currYear = currDate.getFullYear();
  var currMonth = currDate.getMonth();
  var currDay = currDate.getDate();

  //For month chart
  //fetchAndStorePrice(new Date(currYear, currMonth, 30));
  fetchAndStorePrice(new Date(currYear, currMonth, 27));
  fetchAndStorePrice(new Date(currYear, currMonth, 24)); 
  fetchAndStorePrice(new Date(currYear, currMonth, 21));
  fetchAndStorePrice(new Date(currYear, currMonth, 18)); 
  fetchAndStorePrice(new Date(currYear, currMonth, 15));
  fetchAndStorePrice(new Date(currYear, currMonth, 13)); 
  fetchAndStorePrice(new Date(currYear, currMonth, 10));
  fetchAndStorePrice(new Date(currYear, currMonth, 7));
  fetchAndStorePrice(new Date(currYear, currMonth, 4));
  fetchAndStorePrice(new Date(currYear, currMonth, 1)); 

  //For year chart
  fetchAndStorePrice(new Date(currYear-1, 8, 1));
  fetchAndStorePrice(new Date(currYear-1, 9, 1));
  fetchAndStorePrice(new Date(currYear-1, 10, 1));
  fetchAndStorePrice(new Date(currYear-1, 11, 1));
  fetchAndStorePrice(new Date(currYear-1, 12, 1));
  fetchAndStorePrice(new Date(currYear, 1, 1));
  fetchAndStorePrice(new Date(currYear, 2, 1)); 
  fetchAndStorePrice(new Date(currYear, 3, 1));
  fetchAndStorePrice(new Date(currYear, 4, 1)); 
  fetchAndStorePrice(new Date(currYear, 5, 1));
  fetchAndStorePrice(new Date(currYear, 6, 1)); 
  //fetchAndStorePrice(new Date(currYear, 7, 1));
  
  //For all chart
  fetchAndStorePrice(new Date(currYear-1, 1, 1));
  fetchAndStorePrice(new Date(currYear-1, 4, 1));
  fetchAndStorePrice(new Date(currYear-1, 7, 1));
  fetchAndStorePrice(new Date(currYear-1, 10, 1));
}

