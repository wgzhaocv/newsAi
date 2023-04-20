require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const ytRouter = require("./createAudioFromYTB/YTBHandler");

const { connectToDb, closeConnection } = require("./db/dbIO");
const { resetMyDB } = require("./createAudioFromYN/dataSource/dataHandle");
const {
  uploadNewToNginxHLS,
} = require("./createAudioFromYN/audioToStream/upToStream");
const { generateNewsFromYN } = require("./createAudioFromYN/newsGenerator");

// 创建 Express 应用
const app = express();
app.use(cors());

// 使用JSON解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 使用API路由
app.use('/yt', ytRouter);


// 设置路由
app.get("/", (req, res) => {
  uploadNewToNginxHLS();
  // generateNewsFromYN();
  // resetMyDB();

  res.send("Hello World!");
});

// 设置静态文件目录，如果需要
app.use(express.static("public"));

// 启动 HTTP 服务器
const server = app.listen(3000, async () => {
  try {
    console.log("Express server listening on port 3000");
    await connectToDb();
    // 设置一个每天每隔半小时（0 分和 30 分）执行的任务
    // cron.schedule("0,30 * * * *", getAndSaveData);
    // cron.schedule("*/3 * * * *", getAndSaveData);
  } catch (error) {
    process.exit(1);
  }
});

// 在应用停止时关闭数据库连接
const shutdown = async () => {
  console.log("Shutting down the server...");
  await closeConnection();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// 创建 Socket.IO 服务器并设置 CORS 配置
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 处理 Socket.IO 连接
io.on("connection", (socket) => {
  console.log("A user connected");

  // 处理来自客户端的消息
  socket.on("message", (msg) => {
    console.log("Message:", msg);
    // 广播消息给其他客户端
    socket.broadcast.emit("message", msg);
  });

  // 处理客户端断开连接
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
