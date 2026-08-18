import dotenv from "dotenv";

dotenv.config({path : `.env.${process.env.NODE_ENV || 'development'}.local`});

export const{
  FRONTEND  , 
  MONGODB_URI , 
  JWT_SECRET , 
  SALT_ROUND
} = process.env;