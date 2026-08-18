import { Request } from "express";
import { UserInterface } from "../models/user.model";
import { JwtPayload } from "jsonwebtoken";

export interface userPlayLoad extends JwtPayload {
  userId : any , 
  email : string ,
  role : string 
} 

export interface authRequest extends Request{
  user ?: null | UserInterface
}