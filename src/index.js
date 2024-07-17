import { app } from './app.js';
import dotenv from 'dotenv'
import connectDB from './db/db.js';

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongo DB connection failed ",error);
})