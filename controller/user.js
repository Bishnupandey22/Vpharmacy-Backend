const jwt = require("jsonwebtoken")
require("dotenv").config()
const PRIVATEKEY = process.env.PRIVATEKEY;
const bcrypt = require("bcrypt")
const userModel = require("../model/users")
const role = require("../model/role/role");
const prescriptionModel = require("../model/prescription/Prescription");

exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const isUserExists = await userModel.findOne({ email: email }).populate("role")

        if (isUserExists) {
            if (!isUserExists?.isActive) {
                return res.status(401).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }

            const isAuth = bcrypt.compareSync(password, isUserExists.password)
            if (isAuth) {

                const token = jwt.sign({ email: req.body.email }, PRIVATEKEY)
                // for testing period both of them is 30 day else is 1 day or 7 day

                return res.status(200).send({
                    token: token,
                    info: isUserExists,
                    message: "Login Success"
                })
            } else {
                return res.status(402).send({
                    message: "Password Not Matched"
                })
            }
        } else {
            return res.status(404).send({
                message: "User Not Found"
            })
        }
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error "
        })
    }
}

exports.signUp = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, password, phone } = req.body
        const isUserExists = await userModel.findOne({ email: email })
        const roleId = 6
        const designation = "user"
        if (isUserExists) {
            return res.status(400).send({
                message: "User Already Exists with This Email"
            })
        }
        const hashedPassword = bcrypt.hashSync(password, 10)
        const createUser = await userModel.create({ firstName, middleName, lastName, email, password: hashedPassword, phone, roleId, designation })
        if (!createUser) {
            return res.status(400).send({
                message: "Getting Error while signup"
            })
        }
        return res.status(200).send({
            message: "Sucessfully Signup"
        })
    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

exports.uploadPrescription = async (req, res) => {
    try {
        console.log("hitting")
        const { userId, patientName } = req.body

        console.log(req.body, "Req")
        console.log(req.file, "Req")
        const user = userModel.findById(userId)
        if (!user) {
            return res.status(404).send({
                message: "User Not Found"
            })
        }


        let prescriptionObject = {
            userId: userId,
            patientName: patientName
        }
        if (req.file && req.file.filename) {
            console.log("contain file")
            prescriptionObject = {
                ...prescriptionObject,
                prescription: req.file.filename
            }
        }
        if (req.body.removeProfileImage == "true") {
            console.log("remove file")
            prescriptionObject = {
                prescription: null,
                ...prescriptionObject
            };
        }
        console.log("prescriptionObject", prescriptionObject)
        const createPrescription = await prescriptionModel.create(prescriptionObject)
        if (!createPrescription) {
            return res.status(400).send({
                message: "Getting Error During Uploading Prescription"
            })
        }
        return res.status(200).send({
            message: "Sucessfuly Uploaded Prescription"
        })
    } catch (error) {
        console.log(error, "error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}
// View Prescription
exports.viewPrescription = async (req, res) => {
    try {
        const { id } = req.params
        const prescription = await prescriptionModel.findById(id)
        if (!prescription) {
            return res.status(404).send({
                message: "Prescription Not Found"
            })
        }

        return res.status(200).send({
            message: "Sucessfully Found Prescription",
            prescription: prescription

        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error "
        })
    }
}
// Get All Prescription
exports.getAllPrescription = async (req, res) => {
    try {
        console.log("hitting")
        const { userId } = req.params
        const user = await userModel.findById(userId)
        const prescription = await prescriptionModel.find({ userId: userId })
        if (!user) {
            return res.status(404).send({
                message: "User Not Found"
            })
        }
        if (!prescription) {
            return res.status(400).send({
                message: "Getting Error in finding Orders"
            })
        }
        return res.status(200).send({
            message: 'Sucessfully find All Orders',
            orders: prescription
        })
    } catch (error) {
        console.log(error, "error")
        return res.status(500).send({
            message: 'Internal Server Error'
        })
    }
}