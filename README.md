# bitcoin_price_api

The bitcoin_price_api has been developed on NodeJS. It fetches bitcoin prices  every hour (configurable) from coinapi and stores them in a history-table in MongoDB database.
Get APIs are available to fetch history data of different types, ie, day, month, year, all etc.

The API can be starting using command:
npm install (to install dependencies first-time)
node server.js

### List of APIs
- /chart/BTC/EUR/day: It fetches bitcoin price history for past 24 hours
- /chart/BTC/EUR/month: It fetches daily bitcoin price history for past 1 month
- /chart/BTC/EUR/year: It fetches monthly bitcoin price history for past 1 year
- /chart/BTC/EUR/all: It fetches bitcoin price history for past 3 years
- /captions: Returns list of captions
- /prices: Returns prices
