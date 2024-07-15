import mongoose from "mongoose";
import { DB_name } from "../constants.js";

const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`)
        console.log(`Mongo DB connected !! DB Host : ${connectionInstance.connection.host}`)       
    }
    catch(error){
        console.log('Mongo DB connection failed', error)
        process.exit(1)
    }
}
export default connectDB;