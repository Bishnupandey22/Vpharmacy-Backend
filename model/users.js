const mongoose = require("mongoose")
const objectId = mongoose.Schema.ObjectId

const userSchema = new mongoose.Schema({
    role: { type: objectId, ref: "role" },
    firstName: { type: String, required: true },
    lastName: { type: String },
    middleName: { type: String },
    gender: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    email: { type: String, required: true },
    password: { type: String },
    phone: { type: String, default: null },
    city: { type: String, default: null },
    village: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: "India" },
    zipCode: { type: String, default: null },
    address: { type: String, default: null },
    isActive: { type: Boolean, default: true },

    // designation
    designation: { type: String, default: null },
    profileImage: { type: String, default: null },
    profileCreated: { type: Boolean, default: false },
    roleId: { type: Number },
    // 1:Super Admin
    // 2:Admin
    // 3:Doctor
    // 4:Health Expert
    // 5:Delevery Boy
    // 6:Normal User
    verificationOtp: { type: String },
    otpGeneratedAt: { type: Date },
    OTP: { type: String },
    deletedAt: {
        type: Date,
        default: null,
    },

}, { timestamps: true })

const userModel = mongoose.model("user", userSchema);
module.exports = userModel 