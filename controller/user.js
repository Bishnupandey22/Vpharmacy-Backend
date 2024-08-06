const jwt = require("jsonwebtoken")
require("dotenv").config()
const PRIVATEKEY = process.env.PRIVATEKEY;
const bcrypt = require("bcrypt")
const userModel = require("../model/users")
const role = require("../model/role/role")

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