import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError(400,"channel id is required")
    }
    const userId = req?.user._id
    const credentials = {
        subscriber : userId,
        channel : channelId
    }
    const isSubscribed =await Subscription.findOne(credentials)
    if(!isSubscribed){
        const newSubscription = await Subscription.create(credentials)
        if(!newSubscription){
            throw new ApiError(400, "unable to subscribe")
        }
        return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed"))
    }
    const deleteSubscription = await Subscription.deleteOne(credentials)
    if(!deleteSubscription){
        throw new ApiError(400, "unable to delete subscription")
    }
    return res.status(200).json(new ApiResponse(200, {},"unsubscribed"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    if(!subscriberId){
        throw new ApiError(400, "subscriber Id is required")
    }
    const subscribers =  Subscription.aggregate([{
        $match:{
            channel: new mongoose.Types.ObjectId(subscriberId)
        }
    },{
        $group:{
            _id: "channel",
            subscribers : {$push:"$subscriber"}
        }
    },{
        $project:{
            _id:0,
            subscribers:1
        }
    }
])
if(!subscribers || subscribers.length == 0 ){
   return res.status(200).json( new ApiResponse(200, {},"0 subscribers"))
}
return res.status(200).json(new ApiResponse(200, subscribers,"subscribers fetched successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!channelId){
        throw new ApiError(400,"channel id is required")
    }
    const subChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber : new mongoose.Types.ObjectId(channelId)
            }
        },{
            $group:{
                _id : "subscriber",
                subChannels:{$push:"$channel"}
            }
        },{
            $project:{
                _id : 0,
                subChannels:1
            }
        }
    ])
    if(!subChannels || subChannels.length == 0 ){
        return res.status(200).json(new ApiResponse(200, {},"0 subscribed channels"))
    }
    return res.status(200).json(new ApiResponse(200, subChannels,"subscribed channels fetched successfully  "))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}