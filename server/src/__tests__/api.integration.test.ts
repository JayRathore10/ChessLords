import dotenv from "dotenv";
import path from "path";

// 1. FORCE JEST TO READ YOUR DEVELOPMENT ENV FILE
dotenv.config({ path: path.resolve(__dirname, "../../.env.development.local") });
// Fallback just in case the path is slightly different
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import request from "supertest";
import { app } from "../server"; // or "../index"
import { userModel } from "../models/user.model";
import { gameModel } from "../models/game.model";

// Tell Jest to mock the database models
jest.mock("../models/user.model");
jest.mock("../models/game.model");

describe("API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 2. BULLETPROOF MONGOOSE CHAIN MOCKS
    const mockGameChain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
      exec: jest.fn().mockResolvedValue([]),
    };
    (gameModel.find as jest.Mock).mockReturnValue(mockGameChain);

    const mockUserChain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: "1", username: "Magnus", rating: 2800 },
        { _id: "2", username: "Hikaru", rating: 2750 },
      ]),
      exec: jest.fn().mockResolvedValue([]),
    };
    (userModel.find as jest.Mock).mockReturnValue(mockUserChain);

    // 3. MOCK PROTOTYPE METHODS FOR TOKEN GENERATION
    userModel.prototype.getJwtToken = jest.fn().mockReturnValue("fake_jwt_token");
    userModel.prototype.generateAuthToken = jest.fn().mockReturnValue("fake_jwt_token");
    userModel.prototype.createJWT = jest.fn().mockReturnValue("fake_jwt_token");
    userModel.prototype.matchPassword = jest.fn().mockResolvedValue(true);
    userModel.prototype.comparePassword = jest.fn().mockResolvedValue(true);
  });

  describe("Authentication Routes (/api/v1/auth)", () => {
    it("POST /register - should register a new user and return 201", async () => {
      (userModel.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockCreatedUser = {
        _id: "fake_id_123",
        name: "Test User",
        username: "testuser",
        email: "test@test.com",
        getJwtToken: jest.fn().mockReturnValue("fake_jwt_token"),
      };

      (userModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      jest.spyOn(userModel.prototype, "save").mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Test User",
          username: "testuser",
          email: "test@test.com",
          password: "password123",
          confirmPassword: "password123",
        });

      if (res.status >= 400) {
        console.log("Register Route Failed! Status:", res.status, "Body:", res.body);
      }

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it("POST /login - should fail with invalid credentials", async () => {
      (userModel.findOne as jest.Mock).mockResolvedValue(null); 

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "wrong@test.com",
          password: "wrongpassword",
        });

      expect([400, 401, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe("User Routes (/api/v1/users)", () => {
    it("GET /leaderboard - should return a list of top users", async () => {
      const res = await request(app).get("/api/v1/users/leaderboard");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users.length).toBe(2);
    });
  });

  describe("Game Routes (/api/v1/games)", () => {
    it("GET /lobby/stats - should return current lobby statistics", async () => {
      (gameModel.countDocuments as jest.Mock).mockResolvedValue(100);

      const res = await request(app).get("/api/v1/games/lobby/stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });
  });
});