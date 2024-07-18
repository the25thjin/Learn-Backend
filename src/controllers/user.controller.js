import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../models/user.models.js";
import {uploadCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/apiResponse.js"

const registerUSer = asyncHandler(async(req, res)=>{
    // get user detail from frontend
    // validation - not empty
    // check if user already exists : username or email
    // check for images , check for avatar
    // upload them on cloudinary , avatar
    // create user object - create entry in db
    // remove password and refersh token field from response 
    // check for user creation
    // return response

    const {fullName , email , username , password} = req.body

    if([fullName, email , password , username].some((field)=>
        field?.trim() === ""
    )){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await  User.findOne({
        $or: [{email}, {username}]
    })
    if (existedUser){
        throw new ApiError(409 , "User with email or username already exists")
    }
   // const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let avatarLocalPath
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path
    }
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
// console.log(req.files)
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar upload failed")
    }

    const user = await User.create({
        fullName,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
         new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

export default registerUSer