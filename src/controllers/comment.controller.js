import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId){
        throw new ApiError(400, "video id is required")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video doesnt exist")
    }
    const commentAggregate =  Comment.aggregate([
        {
            $match:{
                video : new mongoose.Types.ObjectId(videoId)
            },
            
        },{
            $lookup:{
                from:"users", //collection which is gonna join
                localField:"owner", //field from the input doc
                foreignField:"_id", // field from "from"  local and foreign field should match
                as:"owner" 
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },{
            $addFields:{
                likesCount:{
                    $size : "$likes"
                },
                owner:{
                    $first : "$owner"
                },
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else : false
                    }
                }
            }
        },{
            $project:{
                content : 1,
                createdAt: 1,
                isLiked: 1,
                likesCount:1,
                owner:{
                    username:1,
                    fullName : 1,
                    avatar: 1
                }
            }
        }
    ])
const options = {
    page : parseInt(page,10),
    limit : parseInt(limit, 10) 
}
const comments = await  Comment.aggregatePaginate(commentAggregate,options)

if(!comments || comments.length == 0){
  return res.status(200).json( new ApiResponse(200,{}, "No comments on this video"))
}
return res.status(200).json(new ApiResponse(200,comments,"Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const{videoId} = req.params
    const {content} = req.body 
    if(!videoId){
        throw new ApiError(400,"VideoId is required")
    }
    if(!content){
        throw new ApiError(400,"content is required")
    }
    const video =await Video.findById(videoId)
    if(!video ||(video.owner.toString() !== req.user._id.toString() && !video.isPublished)){
        throw new ApiError("Video doesnt exist")
    }
    const comment =await Comment.create({
        content : content,
        video : videoId,
        owner: req.user._id
    })
    if(!comment){
        throw new ApiError(400, "unable to create comment")
    }
    return res.status(200).json(new ApiResponse(200,comment,"comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400, "comment id is required")
    }
    const {content} = req.body
    if(!content){
        throw new ApiError(400, "content is required")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "comment doesnt exist")
    }
    const videoId = new mongoose.Types.ObjectId(comment.video)
    const video = await Video.findById(videoId)
    if(!video  || !video.isPublished){
        throw new ApiError(400, "Video doesnt exist")
    }
    if(comment.owner.toString() !== req?.user._id.toString()){
        throw new ApiError(400, "unauthorized request")
    }
    const updatedComment = await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content : content
        } 
    },{new: true})
    return res.status(200).json(new ApiResponse(200, updatedComment,"Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400, "comment id is required")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "comment doesnt exist")
    }
    const videoId = new mongoose.Types.ObjectId(comment.video)
    const video = await Video.findById(videoId)
    if(!video  || !video.isPublished){
        throw new ApiError(400, "Video doesnt exist")
    }
    if(comment.owner.toString() !== req?.user._id.toString()){
        throw new ApiError(400, "unauthorized request")
    }
    const deletedComment  = await Comment.findByIdAndDelete(commentId,{new:true})
    if(!deletedComment){
        throw new ApiError(400, "error while deleting comment")
    }
    return res.status(200).json(new ApiResponse(200,{},"Comment deleted"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }