const mongoose = require("mongoose")
const objectId = mongoose.Schema.ObjectId
const prescription = new mongoose.Schema({
    userId: { type: objectId, ref: "user" },
    patientName: { type: String },
    prescription: { type: String, default: null }
})
const prescriptionModel = mongoose.model("prescriptions", prescription)
module.exports = prescriptionModel