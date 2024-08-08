const express = require("express")
const router = express.Router()
const userController = require("../controller/user")
const { uploadPrescription } = require("../utils/multer")
const multer = require("multer")

router.post("/signin", userController.signIn)
router.post("/signup", userController.signUp)
router.post("/uploadPrescription", (req, res, next) => {
    uploadPrescription.single("file")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                console.log(err, "error")
                return res.status(400).send({
                    message: 'File too large. Maximum file size allowed is 1 MB.'
                })
            } else {
                // Other errors
                console.error('Multer Error:', err.message);
                return res.status(statusCode.BadRequest).send({
                    message: err.message
                });
            }
        }
        next()
    });
}, userController.uploadPrescription)

router.get("/getPrescription/:id", userController.viewPrescription)
router.get("/getAllPrescription/:userId", userController.getAllPrescription)
exports.router = router