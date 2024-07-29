const mongoose = require("mongoose")
const pincodeSchema = new mongoose.Schema({
    pincode: { type: String, },
}, { timestamps: true })
const pincodeModel = mongoose.model("pincode", pincodeSchema)
module.exports = pincodeModel;