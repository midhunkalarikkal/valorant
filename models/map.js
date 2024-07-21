const mongoose = require('mongoose')
const mapSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    location : {
        type: String,
        required: true
    },
    desc : {
        type: String,
        required: true
    },
    image : {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Map',mapSchema)