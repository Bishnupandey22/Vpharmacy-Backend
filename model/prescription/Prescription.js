const mongoose = require("mongoose")
const objectId = mongoose.Schema.ObjectId
const prescription = new mongoose.Schema({
    userId: { type: objectId, ref: "user" },
    patientName: { type: String },
    prescription: { type: String, default: null },
    status: { type: String, default: "prescription Uploded" },
    statusCode: { type: String, default: "1" }
    // 1  Prescription uploded
    // 2 order Accepted
    // 3  Bill Complete
    // 4 out for delivery
    // 5 prescription Not Clear
}, { timestamps: true })
const prescriptionModel = mongoose.model("prescriptions", prescription)
module.exports = prescriptionModel