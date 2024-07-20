const http=require("http")
const express=require("express")
const app=express()
const {Server} =require("socket.io")

const server=http.createServer(app)
const io=new Server(server) //input output

// socket.io 
io.on("connection",(socket)=>{
    console.log("A New user create connection",socket.id)
    socket.on("message",message=>{
        io.emit("message",message)//if a event comes from frontend then send all of them
        console.log(message)
    })//name same for frontend and backned
})//when we create a connection from frontend we need io.on and when connection is sucessfull then the call back function is run

// and for frontend 
// socket.emit("message",(message)=>{
//     console.log(message)
// })
// if a event name message then console it


server.listen(9000,()=>{
    console.log("server running")
})//port number