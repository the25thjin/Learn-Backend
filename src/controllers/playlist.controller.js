import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.models.js";
import {Playlist} from "../models/playlist.models.js"
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

const isUserOwnerOfPlaylist = async(playlistId, owner)=>{
    if(!playlistId || !owner){
        throw new ApiError(400, "both fields are required")
    }
    const playlist = await  Playlist.findById(playlistId)
    if(playlist.owner.toString() !== owner.toString()){
        return false;
    }
    return true
}

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name){
        throw new ApiError(400, "Name is required")
    }
    const playlist = await Playlist.create({
        name, description : description || "", owner: req.user._id, videos: []
    })
    if(!playlist){
        throw new ApiError(500,"Something error happened while trying to create a playlist")
    }
    return res
    .status(201)
    .json(new ApiResponse(200,playlist,"Playlist Created Successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400,"user id is required")
    }
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(400, "user doesnt exist")
    }
    const playlist = Playlist.aggregate([
        {
            $match:{ owner : user?.id}
        },
        {
            $project:{
                _id : 1,
                name: 1,
                description: 1,
                owner : 1,
                createdAt: 1,
                updatedAt: 1,
                videos:{
                    $cond:{
                        if:["$owner", new mongoose.Types.ObjectId(req.user?._id)],
                        then: "$videos",
                        else:{
                            $filter:{    
                                input:"$videos",
                                as:"video",
                                $cond:{
                                    $eq:[ "$video.isPublished",true]
                                }
                            }
                        }
                    }
                }
            }
        }

    ])
    if(!playlist){
        throw new ApiError(404,"user does not have playlist")
    }
    return res.status(200).json(new ApiResponse(200, playlist,"User playlist fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400,"playlist id is required")
    }
    const playlist = Playlist.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
           $project:{   
            name :1,
            description: 1,
            createdAt: 1,
            updatedAt:1,
            videos:{
                $cond:{
                    $if:{$eq:["$owner",new mongoose.Types.ObjectId(req?.user._id)]},
                    then: "$videos",
                    else:{
                        $filter:{
                            input: "$videos",
                            as:"video",
                            cond:{
                                $eq:["$video.isPublished", true]
                            }
                        }
                    }
                }
            }
           } 
        }
    ])
    if(!playlist){
        throw new ApiError(400,"playlist does not exist")
    }
    return res.status(200).json(new ApiResponse(200, playlist,"playlist fetched from playlist id"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new ApiError(400, "Both fields are required")
    }
    const isUserOwner = await isUserOwnerOfPlaylist(playlistId,req.user._id)
    if(!isUserOwner){
        throw new ApiError(400,"invalid authorization")
    }
    const video = await Video.findById(videoId)
    if(!video || !video.isPublished){
        throw new ApiError(404,"video not found")
    }
    const playlist =await Playlist.findById(playlistId)
    if( playlist.videos.includes(videoId)){
        return res.status(200).json(200,{},"Video already added to playlist")
    }
    const addedPlaylist = await Playlist.updateOne({_id: new mongoose.Types.ObjectId(playlistId)},{$push:{videos:videoId}})
    if(!addedPlaylist){
        throw new ApiError(400,"unable to add video in the playlist")
    }
    return res.status(200).json(new ApiResponse(200,addedPlaylist,"video added in the playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId){
        throw new ApiError(400,"both fields are required")
    }
    const isUserOwner = await isUserOwnerOfPlaylist(playlistId,req.user._id)
    if(!isUserOwner){
        throw new ApiError(400,"invalid authorization")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist does not exist")
    }
    const video = await Video.findById(videoId)
    if(!video || !video.isPublished){
        throw new ApiError(404,"video does not exist")
    }
    if(!playlist.videos.includes(videoId)){
        return res.status(200).json(new ApiResponse(200,{},"video not found in the playlist"))
    }
    const deletedInPlaylist = await Playlist.deleteOne({_id:new mongoose.Types.ObjectId(playlistId)},{$pull:{videos:videoId}}) 
    if(!deletedInPlaylist){
        throw new ApiError(400,"unable to delete video from playlist")
    }
    return res.status(200).json(new ApiResponse(200,{},"video deleted from the playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400, "playlist id is required")
    }
    const isUserOwner = await isUserOwnerOfPlaylist(playlistId, req.user._id)
    if(!isUserOwner){
        throw new ApiError(400, "invalid authorization")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new  ApiError(400, "unable to delete playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Playlist Deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId){
        throw new ApiError(400,"playlist id is required")
    }
    const isUserOwner = await isUserOwnerOfPlaylist(playlistId, req.user._id)
    if(!isUserOwner){
        throw new ApiError(400,"invalid authorization")
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name, description
        }
    },{new:true})
    if(!playlist){
        throw new ApiError(400, "unable to update playlist")
    }
    return res.status(200).json(new ApiResponse(200, playlist,"Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}