import { Router } from 'express';
import Message from '../models/Message.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';
const router=Router();
router.use(protect);
async function canAccess(courseId,user){if(user.role==='admin')return true;
const course=await Course.findById(courseId);
if(!course)return false;
if(user.role==='instructor'&&course.instructor.equals(user._id))return true;
return !!(await Enrollment.exists({course:courseId,student:user._id,status:'approved'}));
}
router.get('/:courseId',async(req,res,next)=>{try{if(!await canAccess(req.params.courseId,req.user))return res.status(403).json({message:'Course access required'});res.json(await Message.find({course:req.params.courseId}).populate('sender','name role').sort({createdAt:1}).limit(200))}catch(e){next(e)}});
router.post('/:courseId',async(req,res,next)=>{try{if(!await canAccess(req.params.courseId,req.user))return res.status(403).json({message:'Course access required'});if(!req.body.body?.trim())return res.status(400).json({message:'Message cannot be empty'});const message=await Message.create({course:req.params.courseId,sender:req.user._id,body:req.body.body});res.status(201).json(await message.populate('sender','name role'))}catch(e){next(e)}});
export default router;
