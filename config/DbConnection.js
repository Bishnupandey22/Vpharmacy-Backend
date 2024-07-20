const mongoose = require("mongoose")

const connectDb = async (DATABASE_URL) => {
    console.log("DATABASE_URL", DATABASE_URL)
    try {
        const DB_OPTION = {
            dbName: 'vPharmacy',
        }
        await mongoose.connect("mongodb+srv://Bishnu:cKQe4k1tP1z2UxNZ@cluster0.uwk13g1.mongodb.net/vPharmacy", DB_OPTION);
        console.log("mongodb connected Sucessfully")
    } catch (error) {
        console.log(error, "error")
    }
}
module.exports = connectDb