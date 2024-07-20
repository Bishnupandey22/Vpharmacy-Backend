const mongoose = require("mongoose")

const roleSchema = new mongoose.Schema({
    id: { type: Number },
    name: { type: String },
    capability: { type: String, default: null },
    isActive: { type: String, default: 1 }
}, { timestamps: true }
)
const roleModel = mongoose.model("role", roleSchema)
module.exports = roleModel