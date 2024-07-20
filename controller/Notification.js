const notificationModel = require("../model/notification/Notification")

// Un Read Notification
exports.unReadNotification = async (req, res) => {
    try {
        const { userId } = req.params
        const notification = await notificationModel.find({ userId: userId, isRead: false })
        if (!notification) {
            return res.status(404).send({
                message: "No Notification Found"
            })
        }
        return res.status(200).send({
            message: "Notification Found ....",
            count: notification.length,
            notification: notification
        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// Read Notification 
exports.readNotification = async (req, res) => {
    try {
        const { userId } = req.params
        const notification = await notificationModel.find({ userId: userId, isRead: true })
        if (!notification) {
            return res.status(404).send({
                message: 'No Notification Found'
            })
        }
        return res.status(200).send({
            message: "Notification Found Sucessfully ...",
            count: notification.length,
            notification: notification
        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// Get all Notification List With Pagination
exports.getAllNotification = async (req, res) => {
    try {
        const { userId } = req.params
        const searchText = req.query.keyword ? req.keyword.keyword.trim() : ""
        const page = req.query.page || 1
        const limit = req.query.perPage || 10
        const skip = (page - 1) * limit

        let whereCondition = {
            userId: userId
        }
        if (searchText) {
            whereCondition.$or = [
                { header: { $regex: searchText, options: "i" } },
                { subHeader: { $regex: searchText, options: "i" } }
            ]
        }
        if (!searchText) {
            delete whereCondition.$or
        }
        const [notification, count] = Promise.all([
            notificationModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: "desc" }),
            notificationModel.countDocuments(whereCondition)
        ])
        return res.status(200).send({
            message: "Notification List ......",
            count: count,
            notification: notification
        })
    } catch (error) {
        console.log("Error", error)
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }

}

// View Notification
exports.viewNotification = async (req, res) => {
    try {
        const { id } = req.params
        // const notification=await notificationModel.findById(id)
        // if(!notification){
        //     return res.status(404).send({
        //         message:"Notification Not Found"
        //     })
        // }
        const notification = await notificationModel.findByIdAndUpdate(
            { _id: id },
            { $set: { isRead: true } },
            { new: true }
        )
        if (!notification) {
            return res.status(400).send({
                message: "Getting Error While Searching Notification"
            })
        }
        return res.status(200).send({
            message: "Notification Found....",
            notification: notification
        })
    } catch (error) {
        console.log("Error", error)
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// Delete notification 
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params
        const notification = await notificationModel.findOneAndDelete({ _id: id })
        if (!notification) {
            return res.status(404).send({
                message: "Getting Error While Deleting Notification"
            })
        }

        return res.status(200).send({
            message: "Notification Deleted Sucessfully"
        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}