import { Router } from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { protect,allow } from '../middleware/auth.js';
const router=Router();
router.use(protect,allow('admin'));
router.get('/stats',async(req,res,next)=>{try{
 const [students,instructors,courses,enrollments,pending]=await Promise.all([
  User.countDocuments({role:'student'}),User.countDocuments({role:'instructor'}),Course.countDocuments(),Enrollment.countDocuments({status:'approved'}),Enrollment.countDocuments({status:'pending'})
 ]);res.json({students,instructors,courses,enrollments,pending});
}catch(e){next(e)}});
router.get('/users',async(req,res,next)=>{try{res.json(await User.find().select('-password -resetTokenHash -resetTokenExpires').sort({createdAt:-1}))}catch(e){next(e)}});
router.patch('/users/:id/role',async(req,res,next)=>{try{
 if(!['admin','instructor','student'].includes(req.body.role))return res.status(400).json({message:'Invalid role'});
 if(req.params.id===req.user.id)return res.status(400).json({message:'You cannot change your own role'});
 const user=await User.findByIdAndUpdate(req.params.id,{role:req.body.role},{new:true}).select('-password');if(!user)return res.status(404).json({message:'User not found'});res.json(user);
}catch(e){next(e)}});
router.get('/enrollments',async(req,res,next)=>{try{const rows=await Enrollment.find().populate('student','name email').populate('course','title price').sort({createdAt:-1});res.json(rows)}catch(e){next(e)}});
router.patch('/enrollments/:id',async(req,res,next)=>{try{
 if(!['approved','rejected'].includes(req.body.status))return res.status(400).json({message:'Invalid status'});
 const row=await Enrollment.findByIdAndUpdate(req.params.id,{status:req.body.status,...(req.body.status==='approved'?{enrolledAt:new Date()}:{})},{new:true}).populate('student','name email').populate('course','title');if(!row)return res.status(404).json({message:'Request not found'});res.json(row);
}catch(e){next(e)}});
export default router;
