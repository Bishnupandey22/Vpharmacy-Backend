const express = require("express")
const router = express.Router()
const multer = require("multer")
const { socketInstance } = require("../app")
const superAdminController = require("../controller/superAdmin")
const auth = require("../middleware/jwt")

router.post("/createSuperAdmin", superAdminController.createSuperAdmin)
router.post("/signIn", superAdminController.signIn)
const { uploadProfile } = require("../utils/multer")

// ######### --------- User Routes Starts Here ####### ---------

// Create & Update User
router.post("/createAndUpdateUser", (req, res, next) => {
    uploadProfile.single("profileImage")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // MulterError: File too large
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
}, superAdminController.createAndUpdateUser)

// get all users without pagination
router.get("/getAllUsers/:roleId", superAdminController.getAllUsers)

// get user Data With Pagination
router.get("/getAllUserWithPagination/:roleId", superAdminController.getListOfUserWithPagination)

// View User
router.get("/viewUser/:userId", superAdminController.viewUser)

// Delete User
router.delete("/deleteUser/:userId", superAdminController.deleteUser)

// ##########--------- Inventory routes Statrt Here ########---------

// create & update inventory
router.post("/createInventory", superAdminController.createAndUpdateInventory)

// view Inventory
router.get("/viewInventory/:inventoryId", superAdminController.viewInventory)

// get list of inventory with filter and pagination
router.get("/getListOfInventoryWithPagination", superAdminController.getListOfInventoryWithPagination)

// get list of inventory without pagination
router.get("/getListOfInventory", superAdminController.getListOfInventory)

// delete Inventory
router.delete("/deleteInventory/:inventoryId", superAdminController.deleteInventory)


// ########----------- Biling Routes Satrt Here ----------########

// Create Biling Route
router.post("/createBilling", superAdminController.createAndUpdateBiling)
// Cancel Bill
router.post("/cancelBill/:billId", superAdminController.cancelBill)

// View Biling
router.get("/viewBilling/:billingId", superAdminController.ViewBilling)

// Delete Billing
router.delete("/deleteBilling/:billingId", superAdminController.deleteBilling)

// get list of billing with pagination
router.get("/getListOfBillingWithPagination", superAdminController.getListOfBillingWithPagination)

// get List Of Billing Without Pagination
router.get("/getListOfBilling", superAdminController.getListOfBilling)

// sort Billing data 
router.get("/sortBilling", superAdminController.sortBilling)

// get List of billing with pagination
router.get("/getListOfBillingWithPagination")

// generate bill
router.post("/generateBill", superAdminController.generateBill)

// Uploded prescriptoin with Pagination
router.get("/getUplodedPrescriptionWithPagination", superAdminController.getUplodedPrescription)

// update Prescription Status
router.patch("/updatePrescriptionStatus/:id", superAdminController.updateStatus)

// View Prescription
router.get("/getPrescription/:id", superAdminController.viewPrescription)

// download prescription 
router.get("/downloadPrescription/:id", superAdminController.downloadPrescription)
exports.router = router