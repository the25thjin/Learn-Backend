import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {Tweet} from "../models/tweet.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose,{isValidObjectId} from "mongoose";


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }
    const tweet =await Tweet.create({
        content: content,
        owner: req?.user._id
    })
    if(!tweet){
        throw new ApiError(400, "Error while creating tweet")
    }
    return res.status(200).json(new ApiResponse(200, tweet,"Tweet created Successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400, "User id is required")
    }
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404, "User doesnt exist")
    }
    const tweet = Tweet.aggregate([{
        $match:{
            owner: new mongoose.Types.ObjectId(userId)
        }
    },{
        $group:{
            _id :"owner",
            tweets:{$push:"$content"}
        }
    },{
        $project:{
            _id:0,
            tweets:1
        }
    }
])
    if(!tweet || tweet.length === 0){
      return res.status(200).json(new ApiResponse(200,{},"User have no tweets"))
    }
    return res.status(200).json(new ApiResponse(200, tweet, "tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetId} = req.params
    if(!content || !tweetId){
        throw new ApiError(400, "All fields are required")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet doesnt exist")
    }
    if(tweet?.owner.toString() !== req?.user._id.toString()){
        throw new ApiError(400, "Invalid authorization")
    }
    const updatedTweet = await  Tweet.findByIdAndUpdate(tweetId,{
        $set:{
            content: content
        }
    },{new: true})
    if(!updatedTweet){
        throw new ApiError(400, "Error while updating tweet")
    }
    return res.status(200).json(new ApiResponse(200,updatedTweet,"Tweet updated"))
   
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if( !tweetId){
        throw new ApiError(400, "Tweet id is required")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet doesnt exist")
    }
    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "Invalid authorization")
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet){
        throw new ApiError(400, "Error while deleting tweet")
    }
    return res.status(200).json(new ApiResponse(200,{},"Tweet deleted"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}