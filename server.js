const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const config = require('./config/config.js');


// create express app
const app = express();
require('./routes/price.routes.js')(app);


// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())


mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(config.db.url, {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");  
    // Start API
	app.listen(config.port, () => {
		console.log("Server is listening on port " + config.port);

		//Start building history at regular intervals
		const priceService = require('./services/price.service.js');
	    priceService.init();
	});
    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});