import { Router } from 'express';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { protect, allow } from '../middleware/auth.js';
const router=Router();
router.get('/mine',protect,allow('student'),async(req,res,next)=>{try{
 const items=await Enrollment.find({student:req.user._id}).populate({path:'course',populate:{path:'instructor',select:'name'}}).sort({updatedAt:-1});res.json(items);
}catch(e){next(e)}});
router.patch('/:enrollmentId/lessons/:lessonId/complete',protect,allow('student'),async(req,res,next)=>{try{
 const enrollment=await Enrollment.findOne({_id:req.params.enrollmentId,student:req.user._id,status:'approved'});if(!enrollment)return res.status(404).json({message:'Approved enrolment not found'});
 const course=await Course.findById(enrollment.course);if(!course.lessons.id(req.params.lessonId))return res.status(404).json({message:'Lesson not found'});
 if(!enrollment.completedLessons.some(id=>id.equals(req.params.lessonId)))enrollment.completedLessons.push(req.params.lessonId);
 await enrollment.save();res.json(enrollment);
}catch(e){next(e)}});
export default router;
