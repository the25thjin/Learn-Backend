import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
     // console.log('req.cookies.accessToken:', req.cookies.accessToken);
     // console.log('req.header("Authorization"):', req.header("Authorization"));
      const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
      console.log(token);
      if (!token) {
        throw new ApiError(400, "Invalid authorization");
      }
      const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );
      if (!user) {
        throw new ApiError(401, "Invalid Token");
      }
      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid access token")
    }
   
});
