import express from "express"
import cors from "cors"
import http from "http"
import { Server } from "socket.io"
import authRoute from './routes/authRoute.js'
import userRoute from './routes/userRoute.js'
import simulationRoute from './routes/simulationRoute.js'
import dashboardRoute from './routes/dashboardRoute.js'
import warehouseRoute from './routes/warehouseRoute.js'
import alertRoute from './routes/alertRoute.js'
import auditLogRoute from './routes/auditLogRoute.js'
import teamRoute from './routes/teamRoute.js'
import testRoute from './routes/testRoute.js'
import { connectDB } from "./libs/db.js";
import { purgeExpiredSessions } from "./models/Session.js";
import cookieParser from 'cookie-parser'
import { protectedRoute } from "./middlewares/authMiddleware.js";

import dotenv from 'dotenv'
dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

connectDB();

// middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

setInterval(async () => {
  try {
    await purgeExpiredSessions()
  } catch (e) {
    console.error('Purge sessions failed', e)
  }
}, 5 * 60 * 1000)

// public route
app.use("/api/auth", authRoute);
app.use("/api/simulation", simulationRoute); // New route for simulation

// private route
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/warehouse", warehouseRoute);
app.use("/api/alerts", alertRoute);
app.use("/api/auditlog", auditLogRoute);
app.use("/api/team", teamRoute);
app.use("/api/test", testRoute);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_warehouse', (warehouseId) => {
    if (warehouseId) {
      const room = `warehouse_${warehouseId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server runs at port ${PORT}`)
})
