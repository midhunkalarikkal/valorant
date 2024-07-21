const mongoose = require('mongoose')
const agentSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    type : {
        type: String,
        required: true
    },
    origin : {
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

module.exports = mongoose.model('Agent',agentSchema)