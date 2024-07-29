import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) {
    throw new ApiError(400, "videoID is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const likedCriteria = {
    video: videoId,
    likedBy: req?.user._id,
  };
  const alreadyLiked = await Like.findOne(likedCriteria);
  if (!alreadyLiked) {
    const newLike = await Like.create(likedCriteria);
    if (!newLike) {
      throw new ApiError(400, "unable to like video");
    }
    return res.status(200).json(new ApiResponse(200, newLike, "video liked"));
  }
  const dislike = await Like.deleteOne(likedCriteria);
  if (!dislike) {
    throw new ApiError(400, "unable to dislike video");
  }
  return res.status(200).json(new ApiResponse(200, {}, "videodisliked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId) {
    throw new ApiError(400, "commentId is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "comment Not found");
  }
  const likeCriteria = { comment: commentId, likedBy: req.user?._id };
  const alreadyLiked = await Like.findOne(likeCriteria);
  if (!alreadyLiked) {
    //create new like
    const newLike = await Like.create(likeCriteria);
    if (!newLike) {
      throw new ApiError(500, "Unable to like the comment");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newLike, "Successfully like the comment"));
  }
  //already liked
  const dislike = await Like.deleteOne(likeCriteria);
  if (!dislike) {
    throw new ApiError(500, "Unable to dislike the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully dislike the comment"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }
  try {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "tweet Not found");
    }
    const likecriteria = { tweet: tweetId, likedBy: req.user?._id };
    const alreadyLiked = await Like.findOne(likecriteria);
    if (!alreadyLiked) {
      //create new like
      const newLike = await Like.create(likecriteria);
      if (!newLike) {
        throw new ApiError(500, "Unable to like the tweet");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Successfully like the tweet"));
    }
    //already liked
    const dislike = await Like.deleteOne(likecriteria);
    if (!dislike) {
      throw new ApiError(500, "Unable to dislike the tweet");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully dislike the tweet"));
  } catch (e) {
    throw new ApiError(
      500,
      e?.message || "Unable to toggle the like of the tweet"
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;
  const likedVideos = Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $match: {
        "likedVideos.isPublished ": true,
      },
    },
    {
      $lookup: {
        from: "users",
        let: { owner_id: "$likedVideos.owner" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$owner_id"] },
            },
          },
          {
            $project: {
              id: 0,
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$likedVideos._id",
        title: "$likedVideos.title",
        thumbnail: "$likedVideos.thumbnail",
        owner: {
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },
      },
    },
    {
      $group: {
        _id: null,
        likedVideos: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        likedVideos: 1,
      },
    },
  ]);
  if (likedVideos.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No liked videos found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "LikedVideos fetched Successfully!")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
