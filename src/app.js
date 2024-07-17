// import mongoose from "mongoose"; 
import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({
    limit:'16kb'
}))
app.use(express.urlencoded({
    extended:true,
    limit:'16kb'
}))
app.use(cookieParser())

//importing routes
import userRouter from './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users",userRouter)

export {app}