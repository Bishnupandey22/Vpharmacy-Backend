const pincodeModel = require("../model/pincode/pincode")
const villageModel = require("../model/village/village")

exports.getPincode = async (req, res) => {
    try {
        const pincode = await pincodeModel.find({})
        console.log(pincode, "pincode")
        if (!pincode) {
            return res.status(404).send({
                message: "Pincode not found "
            })
        }
        return res.status(200).send({
            message: "Pincode found Sucessfully",
            pincode: [pincode]
        })
    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}
exports.getVillages = async (req, res) => {
    try {
        const { pincode } = req.params
        const village = await villageModel.find({ pincode: pincode })
        if (!village) {
            return res.status(404).send({
                message: "Village Not Found"
            })
        }
        return res.status(200).send({
            message: "Village Found Sucessfully",
            village: [village]
        })
    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error",
        })
    }
}