// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PORT, CLIENT_URL } from "./config/config.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import farmRoutes from "./routes/farmRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import plotRoutes from "./routes/plotRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import farmingLogRoutes from "./routes/farmingLogRoutes.js";
import careRequestRoutes from "./routes/careRequestRoutes.js";
import harvestRoutes from "./routes/harvestRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notFoundHandler from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// API Prefix
const apiPrefix = "/api/v1";
app.use(`${apiPrefix}`, healthRoutes);
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/farms`, farmRoutes);
app.use(`${apiPrefix}/contracts`, contractRoutes);
app.use(`${apiPrefix}/plots`, plotRoutes);
app.use(`${apiPrefix}/crops`, cropRoutes);
app.use(`${apiPrefix}/farming-logs`, farmingLogRoutes);
app.use(`${apiPrefix}/care-requests`, careRequestRoutes);
app.use(`${apiPrefix}/harvests`, harvestRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
