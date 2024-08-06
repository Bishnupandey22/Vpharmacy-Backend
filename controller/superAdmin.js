const jwt = require("jsonwebtoken")
require("dotenv").config()
const PRIVATEKEY = process.env.PRIVATEKEY;
const bcrypt = require("bcrypt")
const userModel = require("../model/users")
const role = require("../model/role/role")
const inventoryModel = require("../model/inventory/Inventory")
const Billing = require('../model/Biling/biling');
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const Counter = require("../model/counterSchema/CounterSchema");
const { mailSender } = require("../common/emailSend");
const converter = require("number-to-words")
const notificationModel = require("../model/notification/Notification")
const { formatCustomDate } = require("../common/emailSend")
// generate invoice number
// const socketInstance = require("../app")
const { io } = require("../utils/socket")


async function getNextSequenceValue(sequenceName) {
    // await initializeCounter(sequenceName); // Ensure the counter is initialized
    const counter = await Counter.findOneAndUpdate(
        { name: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true }
    );
    return counter.sequence_value;
}
function generateAmountInWords(amount) {
    const [integerPart, decimalPart] = amount.toString().split('.');
    let words = converter.toWords(parseInt(integerPart)) + ' rupees';

    if (decimalPart) {
        words += ' and ';
        for (const digit of decimalPart) {
            words += `${converter.toWords(parseInt(digit))} `;
        }
        words += 'paise only';
    } else {
        words += ' only';
    }

    return words.charAt(0).toUpperCase() + words.slice(1);
}

// create super Admin
exports.createSuperAdmin = async (req, res) => {
    console.log("hiting")
    try {
        const findRole = await role.findOne({
            id: 1
        })
        if (!findRole) {
            return res.status(404).send({
                message: "Role for super admin was not found"
            })
        }

        const isSuperAdminExists = await userModel.findOne({
            email: "superadmin@yopmail.com"
        })
        if (isSuperAdminExists) {
            return res.status(409).send({
                message: "Super Admin Already Exists!"
            })
        }

        const encryptPassword = await bcrypt.hash("Wwz@123", 10)
        if (!encryptPassword) {
            return res.status(402).send({
                message: "Geting Error While hashisng Password"
            })
        }

        const createSuperAdmin = await userModel.create({
            Role: findRole?._id,
            firstName: "Super",
            lastName: "Admin",
            email: "superadmin@yopmail.com",
            password: encryptPassword,
            roleId: 1
        })
        if (!createSuperAdmin) {
            return res.status(300).send({
                message: "Error Occured in creating super admin"
            })
        }
        return res.send({
            message: "Super Admin Create Successfully...",
            admin: createSuperAdmin
        })
    } catch (error) {
        return res.status(500).send({
            message: 'Internal Server Error'
        });
    }
}

exports.signIn = async (req, res) => {
    console.log("hitted")
    try {
        const { email, password, rememberMe } = req.body;

        const isUserExists = await userModel.findOne({ email: email }).populate("role")

        if (isUserExists) {
            if (!isUserExists?.isActive) {
                return res.status(401).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }

            const isAuth = bcrypt.compareSync(password, isUserExists.password)
            if (isAuth) {
                let expiresIn = '1d';
                if (rememberMe) {
                    expiresIn = '7d'; // If remember me is checked, expiry will be 7 days
                }
                const token = jwt.sign({ email: req.body.email }, PRIVATEKEY, { expiresIn })
                // for testing period both of them is 30 day else is 1 day or 7 day
                let expiryTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 1 day in milliseconds

                if (rememberMe) {

                    expiryTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

                }
                return res.status(200).send({
                    token: token,
                    expiryTime: expiryTime,
                    adminInfo: isUserExists,
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

// #########--------- User Starts Here ########-------

// Creaet And Update User
exports.createAndUpdateUser = async (req, res) => {
    try {
        const { id, firstName, middleName, lastName, gender, dateOfBirth, email, password, phone, city, village, state, country, pincode, address, designation, roleId, consultantFee, degree, specilization } = req.body

        // updating user
        if (id) {


            const isUserExists = await userModel.findById(id)
            if (!isUserExists) {
                return res.status(404).send({
                    message: `${designation} Not Found`
                })
            }
            let profileObject = {
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                gender: gender,
                dateOfBirth: dateOfBirth,
                city: city,
                state: state,
                country: country,
                village: village,
                pincode: pincode,
                address: address,
                designation: designation,
                phone: phone,
                consultantFee: consultantFee,
                degree: degree,
                specilization: specilization
            }


            if (req.file && req.file.filename) {
                profileObject = {
                    ...profileObject,
                    profileImage: req.file.filename
                }
            }
            if (req.body.removeProfileImage == "true") {
                profileObject = {
                    profileImage: null,
                    ...profileObject
                };
            }
            if (password) {
                const hash = await bcrypt.hashSync(password, 10)
                profileObject = {
                    ...profileObject,
                    password: hash
                }
                if (roleId !== 1) {
                    const mailOptions = {
                        from: process.env.EMAIL_FROM,
                        to: email,
                        subject: "Welcome Email",
                        template: "changePassword",
                        context: {
                            email: email,
                            name: firstName + " " + lastName,
                            password: password,
                            designation: designation
                        },
                    };
                    await mailSender(mailOptions)
                }

            }
            const updateUser = await userModel.findByIdAndUpdate(
                { _id: id },
                { $set: profileObject }
            )
            if (roleId !== 1) {
                const mailOptions = {
                    from: process.env.EMAIL_FROM,
                    to: email,
                    subject: "Welcome Email",
                    template: "welcome",
                    context: {
                        email: email,
                        name: firstName + " " + lastName,
                        password: password,
                        designation: designation
                    },
                };
                await mailSender(mailOptions)
            }

            if (!updateUser) {
                return res.status(400).send({
                    message: "Getting Error While Updating User"
                })
            }
            return res.status(200).send({
                message: `Sucessfully update ${designation}`
            })

        } else {

            const isEmailExists = await userModel.findOne({ email: email })
            const isPhoneNumberExists = await userModel.findOne({ phone: phone })
            if (isEmailExists) {
                return res.status(400).send({
                    message: "Email Already exists"
                })
            }
            if (isPhoneNumberExists) {
                return res.status(400).send({
                    message: "Phone Number Already Exists"
                })
            }
            let profileObject = {
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                gender: gender,
                dateOfBirth: dateOfBirth,
                email: email,
                phone: phone,
                city: city,
                state: state,
                country: country,
                village: village,
                pincode: pincode,
                address: address,
                designation: designation,
                roleId: roleId,
                consultantFee: consultantFee,
                degree: degree,
                specilization: specilization
            }

            if (req.file && req.file.filename) {
                profileObject = {
                    ...profileObject,
                    profileImage: req.file.filename
                }
            }
            if (req.body.removeProfileImage == "true") {
                profileObject = {
                    profileImage: null,
                    ...profileObject
                };
            }
            if (password) {
                const hash = await bcrypt.hashSync(password, 10)
                profileObject = {
                    ...profileObject,
                    password: hash
                }

            }


            const createUser = await userModel.create(profileObject)
            if (!createUser) {
                return res.status(400).send({
                    message: `Getting Error While Creating ${designation}`
                })
            }
            if (roleId !== 1) {
                const mailOptions = {
                    from: process.env.EMAIL_FROM,
                    to: email,
                    subject: "Welcome Email",
                    template: "welcome",
                    context: {
                        email: email,
                        name: firstName + " " + lastName,
                        password: password,
                        designation: designation
                    },
                };
                await mailSender(mailOptions)
            }
            return res.status(200).send({
                message: `${designation} Created Sucessfully`
            })

        }


    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// get All Users List Without Pagination
exports.getAllUsers = async (req, res) => {
    try {
        const { roleId } = req.params
        const users = await userModel.find({ roleId: roleId })
        if (!users) {
            return res.status(404).send({
                message: "User Not Found"
            })
        }
        return res.status(200).send({
            message: "User Found Sucessfully",
            user: [users]
        })
    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// get list of user with pagination 
exports.getListOfUserWithPagination = async (req, res) => {
    try {
        const { roleId } = req.params
        const searchText = req.query.keyword ? req.query.keyword.trim() : ''
        const page = parseInt(req.query.page) || 10
        const limit = parseInt(req.query.perPage) || 1
        const skip = (page - 1) * limit
        let whereCondition = {}
        if (roleId) {
            whereCondition.roleId = roleId
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: "i" } },
                { middleName: { $regex: searchText, $options: "i" } },
                { lastName: { $regex: searchText, $options: "i" } },
                { phone: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } },

            ]
        }
        if (!searchText) {
            delete whereCondition.$or
        }
        const [userData, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: "desc" }),
            userModel.countDocuments(whereCondition)
        ])
        return res.status(200).send({
            message: "List of User",
            count: count,
            user: userData
        })
    } catch (error) {
        console.log(error, "error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}



// View User
exports.viewUser = async (req, res) => {
    try {
        const { userId } = req.params
        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({
                message: "User Not Found"
            })
        }
        return res.status(200).send({
            message: "User Found Sucessfully",
            user: user
        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}
// delete User
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params
        const isExists = await userModel.findById(userId)
        if (!isExists) {
            return res.status(404).send({
                message: "User Not Found"
            })
        }
        await userModel.deleteOne({ _id: userId })
        return res.status(200).send({
            message: "User Deleted Sucessfully",

        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

//#######--------- inventory starts here #########

// create and update Inventory
exports.createAndUpdateInventory = async (req, res) => {
    try {
        const { id, medicineName, composition, type, totalQuantity, strip, rate, discount, CGST, SGST, BatchNumber, HSNCode, expiryDate, mrp, minimumStock } = req.body


        if (!totalQuantity || !mrp || !rate) {
            return res.status(400).send({
                message: "totalquantityOfMedicineinAPack or mrp or rate not provided"
            })
        }
        let calculatedStripCount = totalQuantity / strip
        let totalMrp = mrp * strip
        let mrpPerMedicine = parseFloat(totalMrp / totalQuantity).toFixed(2)
        // net rate Calculation
        // let calculatedNetRate = '';
        let calculatedNetRate = parseFloat(rate.toFixed(2));
        // if (CGST && SGST && discount) {
        //     calculatedNetRate = parseFloat((rate + (rate * CGST) / 100 + (rate * SGST) / 100 - (rate * discount) / 100).toFixed(2));
        // } else if (!discount) {
        //     calculatedNetRate = parseFloat((rate + (rate * CGST) / 100 + (rate * SGST) / 100).toFixed(2));
        // } else if (!CGST && !SGST) {
        //     calculatedNetRate = parseFloat((rate - (rate * discount) / 100).toFixed(2));
        // } else {
        //     calculatedNetRate = parseFloat(rate.toFixed(2));
        // }

        // Total Purchased Cost
        let calculatedTotalPurchasedCost = calculatedNetRate * strip

        // profit amount calculation
        let calculatedProfitAmount = ""
        if (calculatedNetRate) {
            calculatedProfitAmount = mrp - calculatedNetRate
        }
        // profile percent Calculation

        let calculatedProfitPercent = ""
        if (calculatedNetRate && calculatedProfitAmount) {
            // calculatedProfitPercent = parseFloat(calculatedProfitAmount / calculatedNetRate * 100).toFixed(2)
            calculatedProfitPercent = parseFloat(((calculatedProfitAmount * 100) / calculatedNetRate).toFixed(2))
        }
        // cost per medicine calculation

        let calculatedCostPerMedicine = parseFloat(calculatedTotalPurchasedCost / totalQuantity).toFixed(2)

        let calculatedTotalMedicineInStoke = totalQuantity
        console.log(totalQuantity, "totalQuantity")
        console.log(calculatedTotalMedicineInStoke, "calculatedTotalMedicineInStoke")
        if (id) {
            const isExists = await inventoryModel.findOne({ _id: id })
            if (!isExists) {
                return res.status(404).send({
                    message: "Inventory Not Found"
                })
            }

            // profile percent=profite/cost*100
            // profile=mrp-costPrice
            const updatedInventtory = await inventoryModel.findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        medicineName: medicineName,
                        composition: composition,
                        type: type,
                        totalQuantity: totalQuantity,
                        strip: strip,
                        rate: rate,
                        discount: discount,
                        CGST: CGST,
                        SGST: SGST,
                        BatchNumber: BatchNumber,
                        HSNCode: HSNCode,
                        netRate: calculatedNetRate,//purchased cost
                        mrp: mrp,
                        totalPurchasedCost: calculatedTotalPurchasedCost,
                        totalMrp: totalMrp,
                        mrpPerMedicine: mrpPerMedicine,
                        profitPercent: calculatedProfitPercent,
                        profitAmount: calculatedProfitAmount,
                        costPerMedicine: calculatedCostPerMedicine,
                        expiryDate: expiryDate,
                        minimumStock: minimumStock,
                        totalMedicineInStoke: calculatedTotalMedicineInStoke,
                        medicinePerStrip: calculatedStripCount
                    }
                }
            )
            if (!updatedInventtory) {
                return res.status(403).send({
                    message: "Getting Error While updating data"
                })
            }
            return res.status(200).send({
                message: "Inventory Updated Sucessfully"
            })

        } else {


            // cost per medicine=totalquantityOfMedicine/mrp
            const createData = await inventoryModel.create({
                medicineName: medicineName,
                composition: composition,
                type: type,
                totalQuantity: totalQuantity,
                strip: strip,
                rate: rate,
                discount: discount,
                CGST: CGST,
                SGST: SGST,
                BatchNumber: BatchNumber,
                HSNCode: HSNCode,
                netRate: calculatedNetRate,//purchased cost
                mrp: mrp,
                totalPurchasedCost: calculatedTotalPurchasedCost,
                totalMrp: totalMrp,
                mrpPerMedicine: mrpPerMedicine,
                profitPercent: calculatedProfitPercent,
                profitAmount: calculatedProfitAmount,
                costPerMedicine: calculatedCostPerMedicine,
                expiryDate: expiryDate,
                minimumStock: minimumStock,
                totalMedicineInStoke: calculatedTotalMedicineInStoke,
                medicinePerStrip: calculatedStripCount

            })
            if (!createData) {
                return res.status(403).send({
                    message: "Error While updating the data"
                })
            }
            return res.status(200).send({
                message: "Inventory created sucessfully"
            })

        }

    } catch (error) {
        console.log(error, "error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// view Inventory
exports.viewInventory = async (req, res) => {
    const { inventoryId } = req.params

    const isExists = await inventoryModel.findById(inventoryId)
    if (!isExists) {
        return res.status(404).send({
            message: "Ineventory not found"
        })
    }
    return res.status(200).send({
        message: "Sucessfully Get Data",
        data: [isExists]
    })
}

// get List of inventory with Pagination
exports.getListOfInventoryWithPagination = async (req, res) => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : ''
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.perPage) || 10
        const skip = (page - 1) * limit

        let whereCondition = {}
        if (searchText) {
            whereCondition.$or = [
                { medicineName: { $regex: searchText, $options: "i" } },
                { composition: { $regex: searchText, $options: "i" } },
                { type: { $regex: searchText, $options: "i" } },
                { BatchNumber: { $regex: searchText, $options: "i" } },
                { HSNCode: { $regex: searchText, $options: "i" } },
            ]
        }

        if (!searchText) {
            delete whereCondition.$or
        }

        const [inventory, count] = await Promise.all([
            inventoryModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: "desc" }),
            inventoryModel.countDocuments(whereCondition)
        ])

        return res.status(200).send({
            message: "List Of Inventory",
            count: count,
            inventory: inventory
        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal server Error"
        })
    }
}


// get list of inventory without pagination

exports.getListOfInventory = async (req, res) => {
    try {
        const listOfInventory = await inventoryModel.find({})
        if (!listOfInventory) {
            return res.status(404).send({
                message: "Inventory Not Found"
            })
        }
        return res.status(200).send({
            message: "INventory Found Sucessfuly....",
            inventory: listOfInventory
        })
    } catch (error) {

    }
}
// delete Inventory 
exports.deleteInventory = async (req, res) => {
    const { inventoryId } = req.params
    const isExists = await inventoryModel.findById(inventoryId)
    if (!isExists) {
        return res.status(404).send({
            message: "Inventory not found"
        })
    }
    const deleteInventory = await inventoryModel.deleteOne({ _id: inventoryId })
    if (!deleteInventory) {
        return res.status(400).send({
            message: "Getting Error While Deleting Inventory"
        })
    }
    return res.status(200).send({
        message: "Sucessfully Deleted Inventory"
    })

}

// ############ Biling Starts Here ######-------------

// Craete And Update Biling

exports.createAndUpdateBiling = async (req, res) => {
    try {
        const { patientId, medicines, address, id, phoneNumber, prescribedBy, village, remark, invoiceType, date, deliveryBoyId, invoiceNumberManual, villageName, adminId, pincode, deliveryCharge } = req.body
        const user = req.user
        const isAdmin = await userModel.findById(adminId)
        if (!isAdmin) {
            return res.status(404).send({
                message: "Admin Not Found"
            })
        }
        // check if patient exists
        // const isPatientExists = await userModel.findById(patientId)

        // if (!isPatientExists) {
        //     return res.status(404).send({
        //         message: "Patient Not found"
        //     })
        // }




        const deliveryBoyExists = await userModel.findById(deliveryBoyId)
        if (!deliveryBoyExists) {
            return res.status(404).send({
                message: "Delivery Boy Not Found"
            })
        }


        // notification Testing
        const bodyString = `${isAdmin?.firstName} ${isAdmin?.lastName} has assigned a new bill for delivery on ${formatCustomDate(new Date())}. Please check the application for details.`;

        const dataObject = {
            header: "New Bill Assigned",
            subHeader: "A new bill has been assigned to you.",
            body: bodyString,
            notificationType: 1,
            userId: deliveryBoyId
        }
        const notification = await notificationModel.create({
            ...dataObject,
        })
        if (!notification) {
            return res.status(400).send({
                message: "Getting Error While Creating Notification"
            })
        }



        if (id) {
            const isBillExists = await Billing.findById(id)
            if (!isBillExists) {
                return res.status(404).send({
                    message: "Biling not found"
                })
            }

            let newMed = []
            let oldMedicine = []
            let medicineStoke = 0
            for (const med of medicines) {
                const medicines = await inventoryModel.findById(med.medicineId)
                if (!medicines) {
                    return res.status(404).send({
                        message: "Medicine Not Found"
                    })
                }
                newMed = [...newMed, med]

            }
            for (const oldMed of isBillExists.medicines) {
                const medicines = await inventoryModel.findById(oldMed.medicineId)
                if (!medicines) {
                    return res.status(404).send({
                        message: "Medicine Not Found"
                    })
                }
                oldMedicine = [...oldMedicine, oldMed]
            }



            for (const newMedItems of newMed) {
                console.log(newMedItems, "newMedItems")

                const oldMedItem = oldMedicine.find(med => med.medicineId.toString() === newMedItems.medicineId)
                console.log(oldMedItem, "oldMedItem")



                if (oldMedItem) {
                    const medicine = await inventoryModel.findById(oldMedItem.medicineId)
                    if (!medicine) {
                        return res.status(404).send({
                            message: "Medicine Not Found"
                        })
                    }
                    const quantityDifference = newMedItems.quantity - oldMedItem.quantity
                    if (quantityDifference > 0) {
                        // If the new quantity is greater, subtract the difference from the stock
                        medicineStoke = medicine.totalMedicineInStoke - quantityDifference

                    }
                    else if (quantityDifference < 0) {
                        medicineStoke = medicine.totalMedicineInStoke - quantityDifference
                    }
                    else {
                        continue
                    }



                    const updateInventory = await inventoryModel.findByIdAndUpdate(
                        { _id: medicine._id },
                        { $set: { totalMedicineInStoke: medicineStoke } },
                        { new: true }
                    )
                    if (!updateInventory) {
                        return res.status(400).send({
                            message: "Getting Error While updating Inventory"
                        })
                    }
                } else {
                    // If oldMedItem is not found in newMed (new medicine added)
                    const medicine = await inventoryModel.findById(newMedItems.medicineId);
                    if (!medicine) {
                        return res.status(404).send({
                            message: "Medicine Not Found"
                        });
                    }
                    medicine.totalMedicineInStoke -= newMedItems.quantity;
                    await medicine.save();
                }
            }
            // Handle case where oldMedItem is not in newMed (remove medicine from stock)
            // for (const oldMedItem of oldMedicine) {
            //     const newMedItem = newMed.find(med => med.medicineId.toString() === oldMedItem.medicineId);

            //     if (!newMedItem) {
            //         // Medicine removed from newMed, add its quantity back to stock
            //         const medicine = await inventoryModel.findById(oldMedItem.medicineId);
            //         if (!medicine) {
            //             return res.status(404).send({
            //                 message: "Medicine Not Found"
            //             });
            //         }
            //         medicine.totalMedicineInStock += oldMedItem.quantity;
            //         await medicine.save();
            //     }
            // }
            for (const oldMedItem of oldMedicine) {
                const newMedItem = newMed.find(med => med.medicineId.toString() === oldMedItem.medicineId.toString());
                console.log(oldMedItem, "oldMedItem")
                console.log(newMedItem, "newMedItem")
                console.log(newMed, "newMed")
                if (!newMedItem) {
                    // Medicine removed from newMed, add its quantity back to stock
                    const medicine = await inventoryModel.findById(oldMedItem.medicineId);
                    if (!medicine) {
                        return res.status(404).send({
                            message: "Medicine Not Found"
                        });
                    }
                    console.log(medicine.totalMedicineInStoke, " medicine.totalMedicineInStock")
                    console.log(oldMedItem.quantity, " oldMedItem.quantity")
                    medicine.totalMedicineInStoke += oldMedItem.quantity; // Add old quantity back to stock
                    await medicine.save();
                }
            }
            const updateBiling = await Billing.findByIdAndUpdate(
                { _id: id },
                {
                    $set:
                    {
                        patientId: patientId,
                        medicines: medicines,
                        address: address,
                        phoneNumber: phoneNumber,
                        prescribedBy: prescribedBy,
                        village: village,
                        // invoiceNumber: invoiceNumber,
                        remark: remark,
                        invoiceType: invoiceType,
                        date: date,
                        deliveryBoyId: deliveryBoyId,
                        villageName: villageName,
                        invoiceNumberManual: invoiceNumberManual,
                        pincode: pincode,
                        deliveryCharge: deliveryCharge
                    },
                }, { new: true }
            )
            if (!updateBiling) {
                return res.status(400).send({
                    message: "Getting Error While Updating bill",
                })
            }
            io.to(deliveryBoyId).emit("sendNotification", dataObject)
            return res.status(200).send({
                message: "Sucessfully Update Biling",
                biling: updateBiling

            })
        } else {
            const year = new Date().getFullYear().toString().slice(-2);
            const invoiceNumber = `VP/${year}/${await getNextSequenceValue('counter')}`;
            for (const med of medicines) {
                const medicine = await inventoryModel.findById(med.medicineId)
                if (!medicine) {
                    return res.status(404).send({
                        message: "Medicine Not Found"
                    })
                }
                console.log(medicine.totalMedicineInStoke, "med.totalMedicineInStock")
                console.log(med.quantity, "medicines.quantity")
                let medicineStoke = medicine.totalMedicineInStoke - med.quantity
                console.log(medicineStoke)
                const updateMedicine = await inventoryModel.findOneAndUpdate(
                    { _id: med.medicineId },
                    { $set: { totalMedicineInStoke: medicineStoke } },
                    { new: true }
                )
                if (!updateMedicine) {
                    return res.status(400).send({
                        message: "Getting Error During Updating the stock"
                    })
                }
            }
            const createBilling = await Billing.create({
                patientId: patientId,
                medicines: medicines,
                address: address,
                invoiceNumber: invoiceNumber,
                phoneNumber: phoneNumber,
                prescribedBy: prescribedBy,
                village: village,
                remark: remark,
                invoiceType: invoiceType,
                date: date,
                deliveryBoyId: deliveryBoyId,
                villageName: villageName,
                invoiceNumberManual: invoiceNumberManual,
                pincode: pincode,
                deliveryCharge: deliveryCharge
            })

            // const newBilling = new Billing({
            //     patientId, medicines, address, termsAndCondition
            // })
            // console.log("hiting2")

            // const saveBiling = await newBilling.save()
            // console.log("hiting2")

            if (!createBilling) {
                return res.status(400).send({
                    message: "Getting Error While creating biling"
                })
            }

            io.to(deliveryBoyId).emit("sendNotification", dataObject, (error) => {
                if (error) {
                    console.error("Error sending notification:", error);
                } else {
                    console.log("Notification sent successfully:", dataObject);
                }
            })
            return res.status(200).send({
                message: "Sucessfully Save Biling",
                biling: createBilling
            })

        }

    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal server Error"
        })
    }
}

// Cancel Bill
exports.cancelBill = async (req, res) => {
    try {
        const { billId } = req.params
        const bill = await Billing.findById(billId)
        if (!bill) {
            return res.status(404).send({
                message: "Bill Not Found"
            })
        }
        for (const med of bill.medicines) {
            const medicine = await inventoryModel.findById(med.medicineId)
            if (!medicine) {
                return res.status(404).send({
                    message: "Medicine Not Found"
                })
            }
            let updatedStoke = medicine.totalMedicineInStoke + med.quantity
            const updatedInventtory = await inventoryModel.findOneAndUpdate(
                { _id: med.medicineId },
                { $set: { totalMedicineInStoke: updatedStoke } },
                { new: true }
            )
            if (!updatedInventtory) {
                return res.status(400).send({
                    message: "Getting Error While Updating the Inventory"
                })
            }
        }
        const updatedBillStatus = await Billing.findOneAndUpdate(
            { _id: billId },
            { $set: { isCancelled: true } },
            { new: true }
        )
        if (!updatedBillStatus) {
            return res.status(400).send({
                message: "Getting Error While updating the Bill Status"
            })
        }
        return res.status(200).send({
            message: "Successfully canceled the bill and updated medicine stock"
        });

    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error "
        })
    }
}

// remove medicine
exports.removeMedicine = async (req, res) => {
    try {
        const { medicineId, quantity } = req.body
        const isExists = await inventoryModel.findById(medicineId)

        const updateInventory = await inventoryModel.findOneAndUpdate({
            _id: medicineId,

        })
        if (!isExists) {
            return res.status(404).send({
                message: "Medicine Not Found"
            })
        }


    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// View the Biling

exports.ViewBilling = async (req, res) => {
    try {
        const { billingId } = req.params
        const isBilingExists = await Billing.findById(billingId).populate('patientId', 'firstName lastName middleName gender dateOfBirth email phone city village state country address')
            .populate('medicines.medicineId',);
        // 'medicineName composition type rate discount CGST SGST BatchNumber HSNCode expiryDate mrp'

        if (!isBilingExists) {
            return res.status(404).send({
                message: "Billing Not found"
            })
        }
        return res.status(200).send({
            message: "Billing details retrived Sucessfully",
            billing: isBilingExists
        })
    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// Delete Billing
exports.deleteBilling = async (req, res) => {
    try {
        const { billingId } = req.params
        const isExists = await Billing.findById(billingId)
        if (!isExists) {
            return res.status(404).send({
                message: "Billing Not Found"
            })
        }
        const deleteBilling = await Billing.deleteOne({ _id: billingId })
        if (!deleteBilling) {
            return res.status(400).send({
                message: "Getting Error While Delete Billing Record"
            })
        }
        return res.status(200).send({
            message: "Sucessfully Deleted Billing"
        })
    } catch (error) {

    }
}

// get list of billing with pagination
exports.getListOfBillingWithPagination = async (req, res) => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : ''
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.perPage) || 10
        const skip = (page - 1) * limit

        let whereCondition = {}
        if (searchText) {
            whereCondition.$or = [
                { invoiceNumber: { $regex: searchText, $options: "i" } },
                { address: { $regex: searchText, $options: "i" } },
            ]
        }
        if (!searchText) {
            delete whereCondition.$or
        }
        const [billing, count] = await Promise.all([
            Billing.find(whereCondition).skip(skip).limit(limit).sort({ _id: "desc" }).populate("patientId"),
            Billing.countDocuments(whereCondition)
        ]);
        return res.status(200).send({
            message: "Biling Found Sucessfully.....",
            count: count,
            billing: billing
        })
    } catch (error) {
        console.log(error, "Error")
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// get Billing Without Pagination
exports.getListOfBilling = async (req, res) => {
    try {
        const billing = await Billing.find({})
        if (!billing) {
            return res.status(404).send({
                message: "Billing Not Found"
            })
        }
        return res.status(200).send({
            message: "Billing Found Sucessfully",
            billing: billing
        })
    } catch (error) {
        return res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

// Sort billing data 
// exports.sortBilling = async (req, res, isVillage = "0") => {
//     try {

//         const page = parseInt(req.query.page) || 1
//         const limit = parseInt(req.query.perPage) || 10
//         const skip = (page - 1) * limit;

//         const search = req.query.keyword || ""
//         const sort = req.query.sort || "month"
//         const sortStartDate = req.query.sortStartDate ? new Date(req.query.sortStartDate) : null
//         const sortEndDate = req.query.sortEndDate ? new Date(req.query.sortEndDate) : null
//         const village = req.query.village ? req.query.village : "0"
//         const medicineSelling = req.query.medicineSelling ? req.query.medicineSelling : "0"//top selling,low selling
//         const profitReport = req.query.profitReport ? req.query.profitReport : "monthly"
//         let whereCondition = {}

//         if (village) {
//             whereCondition = {
//                 ...whereCondition,
//                 village: village
//             }
//         }
//         if (sortStartDate && sortEndDate) {
//             whereCondition.createdAt = { $gte: sortStartDate, $lte: sortEndDate }
//         } else if (sortStartDate) {
//             whereCondition.createdAt = { $gte: sortStartDate }
//         } else if (sortEndDate) {
//             whereCondition.createdAt = { $lte: sortEndDate }
//         }

//         // const pipeline = [
//         //     // { $match: whereCondition }, // Apply initial filters
//         // ];

//         // Add aggregation stages based on sort type
//         // switch (sort) {
//         //     case 'day':
//         //         pipeline.push({
//         //             $group: {
//         //                 _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//         //                 totalRevenue: { $sum: "$amount" } // Or any other aggregation you need
//         //             }
//         //         }, {
//         //             $sort: { _id: 1 } // Sort by day ascending
//         //         });
//         //         break;
//         //     case 'week':
//         //         pipeline.push({
//         //             $group: {
//         //                 _id: { $week: "$createdAt" },
//         //                 totalRevenue: { $sum: "$amount" } // Or any other aggregation you need
//         //             }
//         //         }, {
//         //             $sort: { _id: 1 } // Sort by week ascending
//         //         });
//         //         break;
//         //     case 'month':
//         //         pipeline.push({
//         //             $group: {
//         //                 _id: { $month: "$createdAt" },
//         //                 totalRevenue: { $sum: "$amount" } // Or any other aggregation you need
//         //             }
//         //         }, {
//         //             $sort: { _id: 1 } // Sort by month ascending
//         //         });
//         //         break;
//         //     case 'year':
//         //         pipeline.push({
//         //             $group: {
//         //                 _id: { $year: "$createdAt" },
//         //                 totalRevenue: { $sum: "$amount" } // Or any other aggregation you need
//         //             }
//         //         }, {
//         //             $sort: { _id: 1 } // Sort by year ascending
//         //         });
//         //         break;
//         //     default:
//         //         // Handle invalid sort type
//         //         return res.status(400).send({ message: "Invalid sort type" });
//         // }
//         // const skip = (page - 1) * limit;
//         // pipeline.push({ $skip: skip }, { $limit: limit })


//         const [billing, count] = await Promise.all([
//             Billing.find(whereCondition).skip(skip).limit(limit).sort({ _id: "desc" }),
//             Billing.countDocuments(whereCondition)
//         ])


//         return res.status(200).send({
//             message: "Sucessfully sorted Data",
//             count: count,
//             listBilling: billing
//         })

//     } catch (error) {
//         console.log(error, "Error")
//         return res.status(500).send({
//             message: "Internal Server Error"
//         })
//     }
// }

// exports.sortBilling = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.perPage) || 10;
//         const skip = (page - 1) * limit;

//         const sort = req.query.sort || "month";
//         const sortStartDate = req.query.sortStartDate ? new Date(req.query.sortStartDate) : null;
//         const sortEndDate = req.query.sortEndDate ? new Date(req.query.sortEndDate) : null;
//         const village = req.query.village ? req.query.village : null;
//         const medicineSelling = req.query.medicineSelling ? req.query.medicineSelling : null; // "top" or "low"
//         const profitReport = req.query.profitReport ? req.query.profitReport : "monthly";

//         let matchCondition = {};

//         if (sortStartDate && sortEndDate) {
//             matchCondition.createdAt = { $gte: sortStartDate, $lte: sortEndDate };
//         } else if (sortStartDate) {
//             matchCondition.createdAt = { $gte: sortStartDate };
//         } else if (sortEndDate) {
//             matchCondition.createdAt = { $lte: sortEndDate };
//         }

//         let pipeline = [
//             { $match: matchCondition },
//             {
//                 $lookup: {
//                     from: "users", // Name of the user collection
//                     localField: "patientId",
//                     foreignField: "_id",
//                     as: "patient"
//                 }
//             },
//             { $unwind: "$patient" }
//         ];

//         if (village) {
//             pipeline.push({ $match: { "patient.village": village } });
//         }

//         // Group by date format and calculate total revenue and profit
//         let dateFormat;
//         switch (sort) {
//             case "day":
//                 dateFormat = "%Y-%m-%d";
//                 break;
//             case "week":
//                 dateFormat = "%Y-%U"; // Year and week number
//                 break;
//             case "month":
//                 dateFormat = "%Y-%m";
//                 break;
//             case "year":
//                 dateFormat = "%Y";
//                 break;
//             default:
//                 dateFormat = "%Y-%m"; // Default to month
//         }

//         pipeline.push(
//             {
//                 $group: {
//                     _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
//                     totalRevenue: { $sum: "$amount" }, // Adjust this field to match your schema
//                     totalProfit: { $sum: "$profit" }, // Adjust this field to match your schema
//                     records: { $push: "$$ROOT" }
//                 }
//             },
//             { $sort: { _id: 1 } },
//             { $skip: skip },
//             { $limit: limit }
//         );

//         // Add stages for top/low selling medicines
//         if (medicineSelling) {
//             pipeline = [
//                 { $match: matchCondition },
//                 { $unwind: "$medicines" },
//                 {
//                     $group: {
//                         _id: "$medicines.medicineId",
//                         totalQuantity: { $sum: "$medicines.quantity" }
//                     }
//                 },
//                 { $sort: { totalQuantity: medicineSelling === "top" ? -1 : 1 } },
//                 { $limit: 10 } // Adjust this number as needed
//             ];
//         }

//         const [billing, count] = await Promise.all([
//             Billing.aggregate(pipeline),
//             Billing.countDocuments(matchCondition)
//         ]);

//         return res.status(200).send({
//             message: "Successfully sorted Data",
//             count: count,
//             listBilling: billing
//         });

//     } catch (error) {
//         console.log(error, "Error");
//         return res.status(500).send({
//             message: "Internal Server Error"
//         });
//     }
// };


// new 


exports.sortBilling = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        const sortStartDate = req.query.sortStartDate ? new Date(req.query.sortStartDate) : null;
        const sortEndDate = req.query.sortEndDate ? new Date(req.query.sortEndDate) : null;
        const village = req.query.village ? req.query.village : null;

        let matchCondition = {
            deletedAt: null
        };

        if (sortStartDate && sortEndDate) {
            matchCondition.createdAt = { $gte: sortStartDate, $lte: sortEndDate };
        } else if (sortStartDate) {
            matchCondition.createdAt = { $gte: sortStartDate };
        } else if (sortEndDate) {
            matchCondition.createdAt = { $lte: sortEndDate };
        }

        let aggregationPipeline = [
            {
                $match: matchCondition
            },
            {
                $lookup: {
                    from: "users", // Name of the user collection
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patient"
                }
            },
            {
                $unwind: "$patient"
            }
        ];

        if (village) {
            aggregationPipeline.push({
                $match: { "patient.village": village }
            });
        }

        aggregationPipeline.push(
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    count: [
                        { $count: "total" }
                    ]
                }
            }
        );

        const [result] = await Billing.aggregate(aggregationPipeline);

        const billing = result.data || [];
        const count = result.count[0] ? result.count[0].total : 0;

        return res.status(200).send({
            message: "Successfully sorted Data",
            count: count,
            listBilling: billing
        });

    } catch (error) {
        console.error("Error", error);
        return res.status(500).send({
            message: "Internal Server Error"
        });
    }
};

// generate bill

// this is using pupeeteer

exports.generateBill = async (req, res) => {
    try {
        const { invoiceNumber } = req.body;
        const bill = await Billing.findOne({ invoiceNumber: invoiceNumber }).populate({
            path: 'medicines.medicineId',
            select: 'medicineName mrp discount SGST CGST costPerMedicine mrpPerMedicine expiryDate BatchNumber'
        });

        if (!bill) {
            return res.status(404).send("Bill not found");
        }

        let newAmount = [];
        let totalAmount = 0;
        let discount = 0;
        let subTotal = 0;
        let GST = 0;
        bill.medicines.forEach(item => {

            let costPerMedicine = item.medicineId.mrpPerMedicine;

            discount = parseFloat(((costPerMedicine * item.medicineId.discount) / 100).toFixed(2));
            let cgst = parseFloat(((costPerMedicine * item.medicineId.CGST) / 100).toFixed(2));
            let sgst = parseFloat(((costPerMedicine * item.medicineId.SGST) / 100).toFixed(2));
            GST = cgst + sgst;
            // let amount = parseFloat((costPerMedicine * item.quantity).toFixed(2));
            let amount = Math.round(Number(costPerMedicine * item.quantity))
            // subTotal += parseFloat(((costPerMedicine - discount) * item.quantity).toFixed(2));
            subTotal += Math.round(Number((costPerMedicine - discount) * item.quantity))
            totalAmount += amount;
            newAmount.push({
                medicineName: item.medicineId.medicineName,
                quantity: item.quantity,
                expiryDate: item.medicineId.expiryDate,
                BatchNumber: item.medicineId.BatchNumber,
                mrpPerMedicine: costPerMedicine.toFixed(2),
                amount: amount.toFixed(2)
            });
        });
        subTotal += bill.deliveryCharge
        console.log(subTotal, " subTotal")
        let amountInWords = generateAmountInWords(subTotal)
        console.log("amountInWords", amountInWords)
        const templatePath = path.join(__dirname, '../views/billTemplate.ejs');
        const logoUrl = '/logo/vpharmacylogo.png';
        const html = await ejs.renderFile(templatePath, { bill, logoUrl, newAmount, totalAmount, discount, subTotal, GST, amountInWords });

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 0,
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
            format: 'A4',
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
            printBackground: true
        });

        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=bill_${invoiceNumber}.pdf`,
        });

        res.send(pdf);

    } catch (error) {
        console.error(error)
        res.status(500).send("An error occurred");
    }
};


