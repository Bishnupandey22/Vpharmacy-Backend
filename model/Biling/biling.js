const mongoose = require("mongoose")
const objectId = mongoose.Schema.ObjectId
const shortid = require("shortid");
const bilingmodel = new mongoose.Schema({
    patientId: { type: String },
    phoneNumber: { type: String },
    prescribedBy: { type: String },
    village: { type: String },
    isCancelled: { type: Boolean, default: false },
    medicines: [{
        medicineId: { type: objectId, ref: "inventoryModel", required: true },
        quantity: { type: Number, required: true },
        // dose: { type: String, required: true },  // e.g., "2 tablets", "10 ml"
        // frequency: { type: String, required: true }, // e.g., "3 times a day", "once a week"
        // days: { type: String, required: true }
    }],
    invoiceNumber: { type: String, required: true, unique: true },
    remark: { type: String, default: null },
    address: { type: String, required: true },
    termsAndCondition: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
}, { timestamps: true })


const Billing = mongoose.model("Billing", bilingmodel);
module.exports = Billing;