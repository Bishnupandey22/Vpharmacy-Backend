const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const userModel = require("../model/users")
require("dotenv").config()
const PRIVATEKEY = process.env.PRIVATEKEY

// check user
exports.checkUserAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;
    if (authorization && authorization.startsWith("Bearer")) {
        try {
            token = authorization.split(" ")[1]
            const { email } = jwt.verify(token, PRIVATEKEY)
            if (email) {
                req.user = await userModel.findOne({ email: email })
                next()
            } else {
                return res.status(401).send({
                    message: "unauthorized user"
                })
            }
        } catch (error) {
            console.log(error, "Error")
            return res.status(401).send({
                message: "unauthorized user"
            })
        }
    } else {
        res.send({ status: "Token not provided" });
    }
}

// check Admin
exports.checkAdminAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;
    if (authorization && authorization.startsWith("Bearer")) {
        try {
            token = authorization.split(" ")[1]
            const { email } = jwt.verify(token, PRIVATEKEY)
            if (email) {
                const user = await userModel.findOne({ email: email })
                if (user) {
                    req.user = user;
                    next();
                } else {
                    return res.send({
                        message: "user not found...",
                    });
                }
            } else {
                return res.status(401).send({
                    message: "unauthorized user"
                })
            }
        } catch (error) {
            return res.status(401).send({
                message: "unauthorized user"
            })
        }
    } else {
        res.send({ status: "no token" });
    }
}