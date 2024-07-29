const express = require("express")
const router = express.Router()
const pincodeAndVillage = require("../controller/villageAndPincode")

router.get("/getPincode", pincodeAndVillage.getPincode)
router.get("/getVillage/:pincode", pincodeAndVillage.getVillages)
exports.router = router