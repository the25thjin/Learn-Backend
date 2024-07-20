import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../models/user.models.js";
import {uploadCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/apiResponse.js"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })
        return{accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens")
    }
}

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
const loginUser = asyncHandler(async(req, res)=>{
    const {email, password , username} = req.body
    if(!(email || username)){
        throw new ApiError(400, "Email or username is required")
    }
    const user = await User.findOne({
        $or:[{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesnt exist")
    }
    const isPasswordValid = await  user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Password Incorrect")
    }

   const {accessToken, refreshToken} =  await generateAccessAndRefreshToken(user._id)
    const loggedInUser =await  User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    res
    .status(200)
    .cookie("Access Token: ",accessToken,options)
    .cookie("Refresh Token: ",refreshToken,options)
    .json(new ApiResponse(200, {
        user: loggedInUser, refreshToken, accessToken
    }, "User logged in "))
})
const logoutUser = asyncHandler(async(req, res)=>{
    User.findByIdAndUpdate(req.user._id,{
        $set:{refreshToken: undefined}
    },{new: true})

    const options = {
        httpOnly : true,
        secure: true
    }

    res.status(200).clearcookie("Access Token", accessToken).clearcookie("Refresh Token",refreshToken).json(new ApiResponse(200, {},"User logged out "))
})
export {registerUSer, loginUser,logoutUser} 