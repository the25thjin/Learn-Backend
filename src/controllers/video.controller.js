import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadCloudinary} from "../utils/cloudinary.js"

const isUSerOwner = async(videoId,req)=>{
    const video = await Video.findById(videoId)
    if(req.user._id.toString() == video?.owner.toString()){
        return true
    }
    return false
}
const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
//parse
    page = parseInt(page,10)
    limit = parseInt(limit,10)
//validate
    page = Math.max(1,page)
    limit = Math.min(20,Math.max(1,limit))

    const pipeline = []
    if(userId){
    if(!isValidObjectId){
        throw new ApiError(400,"userId is invalid")
    }}
    pipeline.push({
        $match:{
            owner: new mongoose.Types.ObjectId(userId)
        }
    })

    if(query){
        pipeline.push({
            $match:{
                $text:{
                    $search:query
                }
            }
        })
    }

    const sortCriteria = {}
    if(sortBy || sortType){
        sortCriteria[sortBy] =sortType=== "asc"?1:-1
        pipeline.push({
            $sort: sortCriteria
        })
    }else{
        sortCriteria["createdAt"] = -1
        pipeline.push({
            $sort : sortCriteria
        })
    }
    pipeline.push({
            $skip:(page-1)*limit
    })
    pipeline.push({
        $limit: limit
    })
    const video = Video.aggregate(pipeline)
    if(!video || video.length == 0){
        throw new ApiError(200,"videos are not found")
    }
    return res.status(200).json(new ApiResponse(200, video , "videos fetched successfully"))


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
                                                    // TODO: get video, upload to cloudinary, create video
    if(!(title || description)){
        throw new ApiError(400,"Title and description are required")
    }
    const videoPath = req.files.videoFile[0].path;
    if(!videoPath){
        throw new ApiError(400,"Video is missing")
    }
    const thumbnailPath = req.files.thumbnail[0].path;
    if(!thumbnailPath){
        throw new ApiError(400,"Thumbnail is missing")
    }
   try {
     const publishedVideo = await uploadCloudinary(videoPath)
     if(!publishedVideo){
         throw new ApiError(400, "error while uploading video on cloudinary")
     }
     const publishedThumbnail = await uploadCloudinary(thumbnailPath)
     if(!publishedThumbnail){
         throw new ApiError(400, "error while uploading thumbnail on cloudinary")
     }
     const video = await Video.create({
        videoFile : publishedVideo.url,
        thumbnail : publishedThumbnail.url,
        title : title,
        description: description,
        duration: publishedVideo.duration,
      //  views: publishedVideo.views,
        isPublished:true,
        owner: req.user._id
     })   
     res.status(200).json(new ApiResponse(200,video,"video published successfully"))
   } catch (error) {
    throw new ApiError(400,"error while publishing video")
   } 
   
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId){
        throw new ApiError(400,"videoID is required")
    }
    const video = await Video.findById(videoId)
    if(!video || (!video.isPublished && !(video?.owner.toString() == req.user?._id.toString() )))
    {
        throw new ApiError(400, "Video not found")
    }
    res.status(200).json(200,video,"Video fetched successfully")
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId){
        throw new ApiError(400, "Video id required")
    }
    const authorized = await isUSerOwner(videoId,req)
    if(!authorized){
        throw new ApiError(400, "unauthorised request")
    }
    const {title , description } = req.body
    if(!title && !description ){
        throw new ApiError(400, "One of the field is required")
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        $set:{
            title , description
        }
    },{
        new : true
    })
    if(!video){
        throw new ApiError(400, "Error while updating")
    }
    return res.status(200).json(new ApiResponse(200, video,"video updated"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(400, "Video id required")
    }
    const authorized = await isUSerOwner(videoId,req)
    if(!authorized){
        throw new ApiError(400, "unauthorised request")
    }

    const video = await Video.findByIdAndDelete(videoId)
    if(!video){
        throw new ApiError(404, "error while deleting video")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted "))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }
    const authorized = await isUSerOwner(videoId,req)
    if(!authorized){
        throw new ApiError(400, "unauthorised request")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video doesnt exist")
    }
    const toggledVideo =await  Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished: !video.isPublished
        }
    },{
        new: true
    })
    if(!toggledVideo){
        throw new ApiError(400 , "error while toggling")
    }
    return res.status(200).json(new ApiResponse(200,toggledVideo,"toggled"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}