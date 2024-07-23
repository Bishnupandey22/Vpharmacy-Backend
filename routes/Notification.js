const express = require("express")
const router = express.Router()
const notificationController = require("../controller/Notification")

// unRead Notification
router.get("/unRead/:userId", notificationController.unReadNotification)

// readNotification
router.get("/readNotification/:userId", notificationController.readNotification)

// view Notification
router.get("/viewNotification/:id", notificationController.viewNotification)

// Delete Notification
router.delete("/deleteNotification/:id", notificationController.deleteNotification)

// Get All Notification 
router.get("/getAllNotification/:userId", notificationController.getAllNotification)

exports.router = router