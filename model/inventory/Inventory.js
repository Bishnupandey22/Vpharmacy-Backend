const mongoose = require("mongoose")

const inventoryModel = new mongoose.Schema({
    medicineName: { type: String, default: null },
    composition: { type: String, default: null },
    type: { type: String, },//tab,caps,syr,inj
    totalQuantity: { type: Number },

    totalMedicineInStoke: { type: Number },
    totalPurchasedCost: { type: Number },
    strip: { type: Number },
    rate: { type: Number },
    discount: { type: Number },
    CGST: { type: Number },
    SGST: { type: Number },
    BatchNumber: { type: String },
    HSNCode: { type: String },
    netRate: { type: Number },//purchased cost
    totalPurchasedCost: { type: Number },
    medicinePerStrip: { type: Number },
    totalMrp: { type: Number },
    mrpPerMedicine: { type: Number },
    profitPercent: { type: Number },
    profitAmount: { type: Number },
    costPerMedicine: { type: Number },
    customerDiscount: { type: Number },
    expiryDate: { type: String },
    mrp: { type: Number },
    minimumStock: { type: Number },
    createdAt: { type: Date, default: new Date() },
    deletedAt: { type: Date, default: null },

}, { timestamps: true }
)
const inventory = mongoose.model("inventoryModel", inventoryModel)
module.exports = inventory