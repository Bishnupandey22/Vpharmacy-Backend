// const io = require("socket.io")(server, {
//     pingTimeout: 60000,
//     cors: {
//       origin: '*'
//       // credentials: true,
//     },
//   });
  
  
//   const userSocketMap = new Map();
//   const userOpenChatsMap = new Map();
  
//   io.on("connection", (socket) => {
//     console.log("New client connected");
  
//     // Listen for join room event
//     socket.on("joinRoom", (chatRoomId) => {
//     //   console.log(User joined room ${chatRoomId});
//       socket.join(chatRoomId); // Join the chat room
//     });
  
//     // Listen for send message event
//     socket.on("sendMessage", async ({ chatRoomId, sender, text }) => {
//       try {
//         const messageCount = await EventGroupMessage.countDocuments({
//           chatRoomId
//         });
//         const messageId = messageCount;
  
//         // Create the message
//         let message = await EventGroupMessage.create({
//           chatRoomId,
//           sender,
//           text: { messageId, ...text },
//         });
  
//         const user = await userModel.findById(sender);
  
//         message.sender = user;
  
//         // Emit the new message to all clients in the chat room
//         io.to(chatRoomId).emit("message", message);
//       } catch (error) {
//         console.error("Error sending message:", error);
//       }
//     });
  
  
//     // ##--- One to one chat Starts here-----
  
//     // Listen for join chat room
//     socket.on("joinChatRoom", (userId) => {
//     //   console.log(User joined room ${userId});
//       userSocketMap.set(userId, socket.id);
//       socket.join(userId); // Join the user's room
//     });
  
  
//     // Listen for send message to particular user
//     socket.on("sendOneToOneMessage", async ({ sender, receiver, message }) => {
//       try {
//         const newMessage = await OneToOneChatMessage.create({
//           sender,
//           receiver,
//           message,
//         });
  
//         let conversation = await Conversation.findOne({
//           users: { $all: [sender, receiver] },
//         });
  
//         if (!conversation) {
//           conversation = await Conversation.create({
//             users: [sender, receiver],
//           });
//         }
  
//         conversation.messages.push(newMessage._id);
//         conversation.lastMessage = newMessage._id;
//         // await conversation.save();
  
//         const currentMessage = await OneToOneChatMessage.findById(newMessage?._id).populate({ path: "sender", select: ["_id", "firstName", "lastName", "profileImage"] }).populate({ path: "receiver", select: ["_id", "firstName", "lastName", "profileImage"] });
  
//         // Emit the new message to the receiver
//         io.to(sender).emit("newMessage", currentMessage);
//         io.to(receiver).emit("newMessage", currentMessage);
  
  
  
//         // const receiverSocket = io.sockets.sockets.get(receiver);
//         const receiverSocketId = userSocketMap.get(receiver);
//         const receiverOpenChats = userOpenChatsMap.get(receiver) || new Set();
  
  
//         if(!receiverOpenChats){
//           console.log("comming here 1");
  
//           conversation.unreadCounts.set(receiver, conversation.unreadCounts.get(receiver) + 1);
  
//         }
  
//         if (!receiverOpenChats.has(sender.toString())) {
//           if (!conversation.unreadCounts.get(receiver)) {
//             conversation.unreadCounts.set(receiver, 0);
//           }
//           console.log("comming here 2", conversation.unreadCounts.get(receiver));
//           conversation.unreadCounts.set(receiver, conversation.unreadCounts.get(receiver) + 1);
//         }
  
//         await conversation.save();
  
//         // console.log("receiverSocketId",receiverSocketId);
  
//         if (!receiverSocketId) {
//           const receiverUser = await userModel.findById(receiver);
//           // console.log("receiverUser", receiverUser);
//           const senderUser = await userModel.findById(sender);
//           // console.log("receiverUser.fcmToken", receiverUser.fcmToken);
//           if (receiverUser && receiverUser.fcmToken) {
//             sendNotification(receiverUser.fcmToken, ${senderUser?.firstName}, "Sent you new message", { sender, navigationId: "onToOneChat", });
//           }
//         }
  
  
  
//       } catch (error) {
//         console.error("Error sending message:", error);
//       }
  
//     });
  
  
//     // ##--- One to one chat ends here-----
  
//     // Handle disconnect event
//     socket.on("disconnect", () => {
//       userSocketMap.forEach((value, key) => {
//         if (value === socket.id) {
//           userSocketMap.delete(key);
//           userOpenChatsMap.delete(key);
//         }
//       });
//       console.log("Client disconnected");
//     });
  
  
  
//     // Handle marking messages as read
//     socket.on("markMessagesAsRead", async ({ sender, receiver }) => {
//       try {
//         let conversation = await Conversation.findOne({
//           users: { $all: [sender, receiver] },
//         });
  
//         // console.log("conver un", conversation);
  
//         if (conversation) {
  
//           const count = conversation.unreadCounts.get(sender);
  
//           // console.log("count",count);
  
//           if (count > 0) {
  
//             conversation.unreadCounts.set(sender, 0);
//             await conversation.save();
  
//           }
  
//         }
//       } catch (error) {
//         console.error("Error marking messages as read:", error);
//       }
//     });
  
  
  
//     // fetch chat lists
//     socket.on("fetchChatList", async (userId, callback) => {
//       console.log("hitting fetch list", userId);
//       try {
//         const conversations = await Conversation.find({
//           users: userId,
//         }).populate("users", "firstName lastName profileImage").populate("lastMessage").sort({ updatedAt: -1 });
  
//         const chatList = conversations.map((conv) => {
//           const otherUser = conv.users.find((user) => user._id.toString() !== userId);
  
//           // console.log(" conv.unreadCounts.get(userId) ", conv.unreadCounts );
  
//           if (otherUser) {
//             return {
//               userId: otherUser._id,
//               firstName: otherUser.firstName,
//               lastName: otherUser.lastName,
//               lastMessage: conv.lastMessage,
//               unreadCount: conv.unreadCounts.get(userId) || 0,
//               profileImage: otherUser?.profileImage
//             };
//           }
  
//         });
  
//         callback(chatList);
//       } catch (error) {
//         console.error("Error fetching chat list:", error);
//       }
//     });
  
  
//     // Track open chat rooms for each user
//     socket.on("openChat", ({ sender, receiver }) => {
//       console.log("hitting open chat");
  
  
//       console.log("sender", sender);
//       console.log("receiver", receiver);
  
  
//       if (!userOpenChatsMap.has(sender)) {
//         userOpenChatsMap.set(sender, new Set());
//       }
//       userOpenChatsMap.get(sender).add(receiver);
//       console.log("aa", userOpenChatsMap.get(sender));
//     });
  
//     socket.on("closeChat", ({ sender, receiver }) => {
//       console.log("hitting close chat");
//       if (userOpenChatsMap.has(sender)) {
//         userOpenChatsMap.get(sender).delete(receiver);
//       }
//     });