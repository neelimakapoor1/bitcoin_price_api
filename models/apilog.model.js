const mongoose = require('mongoose');

/**
* Format in which api-calls are logged
**/
const apiLogSchema = mongoose.Schema({
    url: String,
    status: Number,
    time: Date,
    err: String
}, {
    timestamps: true
});

module.exports = mongoose.model('ApiLog', apiLogSchema);