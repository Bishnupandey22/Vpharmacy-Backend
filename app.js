const express = require("express")
const app = express()
const cors = require("cors")
const connectDb = require("./config/DbConnection")
require("dotenv").config()
const DATABASE_URL = process.env.DATABASE_URL
const Roles = require("./model/role/role")
const port = process.env.PORT
connectDb(DATABASE_URL)
const path = require('path');
const superAdminRoutes = require("./routes/superAdmin")
const passport = require('passport');
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

const server = app.listen(port, () => {
    console.log("App Started Sucessfully")
})

// Socket

// const io=require("socket.io")(server,{
//     pingTimeout:60000,
//     cors:{
//         origin:'*'
//     }
// })

// io.on("connection",(socket)=>{
//     console.log("new Client Connected");
//       // Listen for join room event
//     socket.on("joinRoom",(userId)=>{
//         console.log(`User id${userId}`)
//         socket.join(userId)
//     })
//     // listen for send message event
//     socket.on("sendNotification",async())
// })
