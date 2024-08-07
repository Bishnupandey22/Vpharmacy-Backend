/* eslint-disable consistent-return */
const multer = require('multer');
const fs = require('fs')

// create Public folder
if (!fs.existsSync("./public")) {
    fs.mkdirSync("./public")
}

// create profile folder

if (!fs.existsSync("./public/profile")) {
    fs.mkdirSync("./public/profile")
}
if (!fs.existsSync('./public/prescription')) {
    fs.mkdirSync("./public/prescription")
}


// image filter
const imageFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'only imaegs are Allowed!';
        return cb(new Error("Only images are allowed!"), false);
    }
    cb(null, true)
}
// upload profile image

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/profile')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`)
    }
});

// upload prescription
const prescriptionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/prescription')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`)

    }
})

const uploadProfile = multer({
    storage: profileStorage,
    limits: {
        fieldSize: 1024 * 1024,
        files: 1
    },
    fileFilter: imageFilter
})

const uploadPrescription = multer({
    storage: prescriptionStorage,
    limits: {
        fileSize: 1024 * 1024, // 1 MB
        files: 1
    },
    fileFilter: imageFilter
});
exports.uploadProfile = uploadProfile
exports.uploadPrescription = uploadPrescription