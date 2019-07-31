const mongoose = require('mongoose');

/**
* Format in which history is stored
**/
const priceHistorySchema = mongoose.Schema({
    val: mongoose.Schema.Types.Mixed,
    hour: Number,
    date: Number,
    month: Number,
    quarter: Number,
    year: Number,
    time: Date,
    type: String,
    from_curr: String,
    to_curr: String
}, {
    timestamps: true
});

module.exports = mongoose.model('PriceHistory', priceHistorySchema);