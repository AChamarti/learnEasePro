import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { makeToken, publicUser } from '../utils/token.js';
import { protect } from '../middleware/auth.js';
const router = Router();
router.post('/register', async (req,res,next) => {
  try {
    const { name,email,password,role='student' } = req.body;
    if (!name || !email || !password) return res.status(400).json({message:'Name, email and password are required'});
    if (password.length < 8) return res.status(400).json({message:'Password must be at least 8 characters'});
    // Public registration cannot create administrator accounts.
    if (!['student','instructor'].includes(role)) return res.status(400).json({message:'Invalid registration role'});
    if (await User.findOne({email})) return res.status(409).json({message:'Email is already registered'});
    const user = await User.create({name,email,password:await bcrypt.hash(password,12),role});
    res.status(201).json({token:makeToken(user),user:publicUser(user)});
  } catch(e){next(e)}
});
router.post('/login', async(req,res,next)=>{
  try {
    const {email,password}=req.body;
    const user=await User.findOne({email}).select('+password');
    if(!user || !(await bcrypt.compare(password || '',user.password))) return res.status(401).json({message:'Invalid email or password'});
    res.json({token:makeToken(user),user:publicUser(user)});
  }catch(e){next(e)}
});
router.get('/me',protect,(req,res)=>res.json({user:publicUser(req.user)}));
router.post('/forgot-password',async(req,res,next)=>{
  try {
    const user=await User.findOne({email:req.body.email});
    // Same response whether or not the email exists.
    if(user){
      const token=crypto.randomBytes(32).toString('hex');
      user.resetTokenHash=crypto.createHash('sha256').update(token).digest('hex');
      user.resetTokenExpires=Date.now()+30*60*1000; await user.save();
      if(process.env.SMTP_HOST){
        const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT)===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
        const link=`${process.env.CLIENT_URL}/reset-password/${token}`;
        await transporter.sendMail({from:process.env.SMTP_FROM,to:user.email,subject:'Reset your LearnEase Pro password',text:`Reset your password within 30 minutes: ${link}`});
      } else console.log(`Password reset link for ${user.email}: ${process.env.CLIENT_URL}/reset-password/${token}`);
    }
    res.json({message:'If the account exists, password reset instructions have been sent.'});
  }catch(e){next(e)}
});
router.post('/reset-password/:token',async(req,res,next)=>{
  try{
    const hash=crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user=await User.findOne({resetTokenHash:hash,resetTokenExpires:{$gt:Date.now()}});
    if(!user)return res.status(400).json({message:'Reset link is invalid or expired'});
    if(!req.body.password || req.body.password.length<8)return res.status(400).json({message:'Password must be at least 8 characters'});
    user.password=await bcrypt.hash(req.body.password,12);user.resetTokenHash=undefined;user.resetTokenExpires=undefined;await user.save();
    res.json({message:'Password updated. Please log in.'});
  }catch(e){next(e)}
});
export default router;
