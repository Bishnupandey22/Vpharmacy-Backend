const mongoose = require("mongoose")
const objectId = mongoose.Schema.ObjectId
const notificationSchema = new mongoose.Schema({
    userId: { type: objectId, ref: "user" },
    header: { type: String, default: null },
    subHeader: { type: String, default: null },
    body: { type: String, default: null },
    importantId: { type: String, default: null },
    notificationType: { type: Number, required: true },
    // 1 for assigining delivery Boy
    isRead: { type: Boolean, default: false }
}, { timestamps: true })
const notificationModel = mongoose.model("notification", notificationSchema)
module.exports = notificationModel