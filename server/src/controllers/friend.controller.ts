import { Response } from "express";
import mongoose from "mongoose";
import { authRequest } from "../types/authRequest.type";
import { userModel } from "../models/user.model";
import { friendshipModel } from "../models/friendship.model";

export const getFriendsData = async (
  req: authRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const uid = new mongoose.Types.ObjectId(userId);

    // 1. Fetch accepted friendships
    const acceptedFriendships = await friendshipModel
      .find({
        $or: [{ requester: uid }, { receiver: uid }],
        status: "accepted",
      })
      .populate("requester", "username profilePic rating isOnline")
      .populate("receiver", "username profilePic rating isOnline");

    // 2. Extract the other user from each friendship
    const friends = acceptedFriendships.map((f: any) => {
      if (f.requester._id.toString() === userId) {
        return f.receiver;
      }

      return f.requester;
    });

    // 3. Fetch incoming pending requests
    const pendingRequests = await friendshipModel
      .find({
        receiver: uid,
        status: "pending",
      })
      .populate("requester", "username profilePic rating");

    const friendRequests = pendingRequests.map((f: any) => f.requester);

    res.status(200).json({
      friends,
      friendRequests,
    });
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({
      message: "Server error fetching friends",
    });
  }
};

export const sendFriendRequest = async (
  req: authRequest,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user?._id.toString();
    const { targetUsername } = req.body;

    if (!senderId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (
      typeof targetUsername !== "string" ||
      !targetUsername.trim()
    ) {
      res.status(400).json({
        message: "Target username is required",
      });
      return;
    }

    // 1. Find target user
    const targetUser = await userModel.findOne({
      username: targetUsername.trim(),
    });

    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // 2. Prevent sending request to yourself
    if (targetUser._id.toString() === senderId) {
      res.status(400).json({
        message: "Cannot add yourself",
      });
      return;
    }

    // 3. Check existing relationship in either direction
    const existing = await friendshipModel.findOne({
      $or: [
        { requester: senderId, receiver: targetUser._id },
        { requester: targetUser._id, receiver: senderId },
      ],
    });

    if (existing) {
      res.status(400).json({
        message: "Friendship or request already exists",
      });
      return;
    }

    // 4. Create pending friend request
    await friendshipModel.create({
      requester: senderId,
      receiver: targetUser._id,
      status: "pending",
    });

    res.status(200).json({
      message: "Friend request sent",
    });
  } catch (error) {
    console.error("Send request error:", error);
    res.status(500).json({
      message: "Failed to send request",
    });
  }
};

export const respondToRequest = async (
  req: authRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    const { requesterId, action } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // 1. Validate requester ID
    if (
      typeof requesterId !== "string" ||
      !mongoose.isValidObjectId(requesterId)
    ) {
      res.status(400).json({
        message: "Invalid requester ID",
      });
      return;
    }

    // 2. Validate action
    if (action !== "accept" && action !== "reject") {
      res.status(400).json({
        message: "Action must be accept or reject",
      });
      return;
    }

    // 3. Find incoming pending request
    const friendship = await friendshipModel.findOne({
      requester: requesterId,
      receiver: userId,
      status: "pending",
    });

    if (!friendship) {
      res.status(404).json({
        message: "Friend request not found",
      });
      return;
    }

    // 4. Accept or reject request
    if (action === "accept") {
      friendship.status = "accepted";
      await friendship.save();
    } else {
      await friendshipModel.deleteOne({
        _id: friendship._id,
      });
    }

    res.status(200).json({
      message:
        action === "accept"
          ? "Friend request accepted successfully"
          : "Friend request rejected successfully",
    });
  } catch (error) {
    console.error("Respond request error:", error);
    res.status(500).json({
      message: "Failed to process request",
    });
  }
};
