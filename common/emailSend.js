const nodemailer = require("nodemailer")
const path = require("path")
const hbs = require("nodemailer-express-handlebars")
require("dotenv").config()

const handlebarsOption = {
    viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve("./views"),
        defaultLayout: false,
    },
    viewPath: path.resolve("./views"),
    extName: ".handlebars",
}

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
})
transporter.use("compile", hbs(handlebarsOption))

// Mail Sender
exports.mailSender = async (mailOption) => {
    await transporter.sendMail(mailOption, function (err, res) {
        if (err) {
            console.log("Email not send", err);

        } else {
            console.log("Email sent");

        }
    })
}
exports.formatCustomDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleString('en-US', options);
}