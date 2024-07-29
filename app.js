const express = require("express")
const app = express()
const cors = require("cors")
const connectDb = require("./config/DbConnection")
require("dotenv").config()
const DATABASE_URL = process.env.DATABASE_URL
const Roles = require("./model/role/role")
const Counter = require("./model/counterSchema/CounterSchema")
const port = process.env.PORT
connectDb(DATABASE_URL)
const path = require('path');
const superAdminRoutes = require("./routes/superAdmin")
const notificationRoute = require("./routes/Notification")
const passport = require('passport');
const notificationModel = require("./model/notification/Notification")
const pincodeAndVillageRoute = require("./routes/VillageAndPincode")
const pincode = require("./model/pincode/pincode")
const village = require("./model/village/village")
const pincodeArray = require("./utils/pinCode")
const villageArray = require("./utils/Village")
// const { io } = require("./utils/socket")

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('express-session')({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// routes

app.use("/api/superAdmin", superAdminRoutes.router)
app.use("/api/notification", notificationRoute.router)
app.use("/api/pincodeAndVillage", pincodeAndVillageRoute.router)


const roles = [
    { id: 1, name: "super admin" },
    { id: 2, name: "admin" },
    { id: 3, name: "doctor" },
    { id: 4, name: "health expert" },
    { id: 5, name: "delevery boy" },
]



// netlify configuration
// functions/hello.js
// exports.handler = async (event, context) => {
//     return {
//         statusCode: 200,
//         body: JSON.stringify({ message: "Hello, Netlify!" })
//     };
// };


// inserting Role

Roles.countDocuments({})
    .exec()
    .then(count => {
        if (count === 0) {
            // Insert predefined roles into the Role collection
            return Roles.insertMany(roles)
        }
    })
    .catch(err => {
        console.log(err, "error")
    })
    .finally(() => { })

pincode.countDocuments({})
    .exec()
    .then(count => {
        if (count === 0) {
            return pincode.insertMany(pincodeArray)
        } else {
            console.log('pincode already exist in the database.');
        }
    })
    .catch(err => {
        console.error('Error:', err);
    })
    .finally(() => {
    });


village.countDocuments({})
    .exec()
    .then(count => {
        if (count === 0) {
            return village.insertMany(villageArray)
        } else {
            console.log('village already exist in the database.');
        }
    })
    .catch(err => {
        console.error('Error:', err);
    })
    .finally(() => {
    });



// inserting counter value default 100

Counter.countDocuments({})
    .exec()
    .then(count => {
        if (count === 0) {
            const newCounter = new Counter({ name: "counter", sequence_value: 100 })
            return newCounter.save()
        }
    })
    .then(() => {
        console.log("Counter initialized with default value 100.")
    })
    .catch(err => {
        console.error("Error initializing counter:", err);
    });


const server = app.listen(port, () => {
    console.log("App Started Sucessfully")
})
// Socket

const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
        origin: '*'
    }
})



const userSocketMap = new Map();

io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on("joinRoom", (userId) => {
        console.log(`User id ${userId}`);
        socket.join(userId);
        userSocketMap.set(userId, socket.id);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
