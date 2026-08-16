import express  , {Request , Response} from "express";
import cors from "cors";
import { FRONTEND } from "./configs/env.config";

const app = express();
app.use(express.json());

app.use(cors({
  origin: FRONTEND , 
  methods: ["GET", "POST" , "DELETE" , "PUT"],
  credentials: true
}));


app.get("/"  , (req : Request, res : Response)=>{
  res.send("Hi, Jexts here!")
})

export default app;
