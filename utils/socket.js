const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 3000;

const io = socketIo(server, {

    pingTimeout: 60000,
    cors: {
        origin: '*'
    }
});

const userSocketMap = new Map();

io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on("joinRoom", (userId) => {
        console.log(`User id ${userId}`);
        socket.join(userId);
        userSocketMap.set(userId, socket.id);
    });
});
exports.io = io 