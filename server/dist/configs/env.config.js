"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALT_ROUND = exports.JWT_SECRET = exports.MONGODB_URI = exports.FRONTEND = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });
_a = process.env, exports.FRONTEND = _a.FRONTEND, exports.MONGODB_URI = _a.MONGODB_URI, exports.JWT_SECRET = _a.JWT_SECRET, exports.SALT_ROUND = _a.SALT_ROUND;
