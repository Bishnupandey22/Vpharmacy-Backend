const mongoose = require("mongoose")
const villageSchema = new mongoose.Schema({
    pincode: { type: String, },
    villageNames: [{ type: String }]
}, { timestamps: true })
const villageModel = mongoose.model("villages", villageSchema)
module.exports = villageModel;