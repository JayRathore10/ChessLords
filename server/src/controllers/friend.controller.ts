  import { Request, Response } from "express";
  import mongoose from "mongoose";
  import { userModel } from "../models/user.model";
  import { friendshipModel } from "../models/friendship.model"; // Adjust path if needed
  
  export const getFriendsData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
  
      const uid = new mongoose.Types.ObjectId(userId);
  
      // 1. Fetch Accepted Friends (User can be either requester or receiver)
      const acceptedFriendships = await friendshipModel.find({
        $or: [{ requester: uid }, { receiver: uid }],
        status: "accepted",
      })
        .populate("requester", "username profilePic rating isOnline")
        .populate("receiver", "username profilePic rating isOnline");
  
      // Extract the *other* user from the friendship document
      const friends = acceptedFriendships.map((f: any) => {
        if (f.requester._id.toString() === userId) return f.receiver;
        return f.requester;
      });
  
      // 2. Fetch Pending Incoming Requests (User is specifically the receiver)
      const pendingRequests = await friendshipModel.find({
        receiver: uid,
        status: "pending",
      }).populate("requester", "username profilePic rating");
  
      const friendRequests = pendingRequests.map((f: any) => f.requester);
  
      res.status(200).json({
        friends,
        friendRequests,
      });
    } catch (error) {
      console.error("Get friends error:", error);
      res.status(500).json({ message: "Server error fetching friends" });
    }
  };
  
  export const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const senderId = req.user?.userId;
      const { targetUsername } = req.body;
  
      const targetUser = await userModel.findOne({ username: targetUsername });
      if (!targetUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      if (targetUser._id.toString() === senderId) {
        res.status(400).json({ message: "Cannot add yourself" });
        return;
      }
  
      // Check if any relationship (pending, accepted, rejected) already exists in either direction
      const existing = await friendshipModel.findOne({
        $or: [
          { requester: senderId, receiver: targetUser._id },
          { requester: targetUser._id, receiver: senderId },
        ],
      });
  
      if (existing) {
        res.status(400).json({ message: "Friendship or request already exists" });
        return;
      }
  
      // Create new pending request using your model
      await friendshipModel.create({
        requester: senderId,
        receiver: targetUser._id,
        status: "pending",
      });
  
      res.status(200).json({ message: "Friend request sent" });
    } catch (error) {
      console.error("Send request error:", error);
      res.status(500).json({ message: "Failed to send request" });
    }
  };
  
  export const respondToRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { requesterId, action } = req.body; // action: 'accept' | 'reject'
  
      // Find the specific pending request
      const friendship = await friendshipModel.findOne({
        requester: requesterId,
        receiver: userId,
        status: "pending",
      });
  
      if (!friendship) {
        res.status(404).json({ message: "Friend request not found" });
        return;
      }
  
      if (action === "accept") {
        friendship.status = "accepted";
        await friendship.save();
      } else {
        // For rejections, it's usually best to delete the record so they can try again later,
        // or you can set it to 'rejected' depending on if you want to block future requests.
        await friendshipModel.deleteOne({ _id: friendship._id });
      }
  
      res.status(200).json({ message: `Request ${action}ed successfully` });
    } catch (error) {
      console.error("Respond request error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  };