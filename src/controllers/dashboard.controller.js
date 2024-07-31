import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id

    const channelStats = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from: "likes",
                localField:"_id",
                foreignField:"video",
                as:"Likes"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"owner",
                foreignField:"channel",
                as:"Subscribers"
            }
        },
        {
            $group:{
                _id: null,
                totalVideos: {$sum: 1},
                totalViews: {$sum:"$views"},
                totalSubscribers: {$first:{$size:"$Subscribers"}},
                totalLikes :{$first:{$size:"$Likes"}}
            }
        },{
            $project:{
                _id: 0 ,
                totalLikes:1,
                totalSubscribers:1,
                totalVideos:1,
                totalViews:1
            }
        }
    ])
    if(!channelStats){
        throw new ApiError(400, "unable to fetch channel stats")
    }
    return res.status(200).json(new ApiResponse(200, channelStats,"channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id
    const videos = await Video.find({owner:userId})
    if(!videos || videos.length==0){
        return res.status(200).json(new ApiResponse(200, {},"channel doesnt have any videos"))
    }
    return res.status(200).json(new ApiResponse(200, videos,"channel videos fetched successfully"))

})

export {
    getChannelStats, 
    getChannelVideos
    }