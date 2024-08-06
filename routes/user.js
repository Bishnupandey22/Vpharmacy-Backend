const express = require("express")
const router = express.Router()

const userController = require("../controller/user")

router.post("/signin", userController.signIn)
router.post("/signup", userController.signUp)

exports.router = router