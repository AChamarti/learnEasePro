import { Router } from 'express';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Review from '../models/Review.js';
import { protect, allow } from '../middleware/auth.js';
const router=Router();
router.get('/',async(req,res,next)=>{try{
 const filter={published:true}; if(req.query.category)filter.category=req.query.category;
 if(req.query.search)filter.title={$regex:req.query.search,$options:'i'};
 const courses=await Course.find(filter).populate('instructor','name').sort({createdAt:-1});res.json(courses);
}catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{
 const course=await Course.findById(req.params.id).populate('instructor','name bio');if(!course)return res.status(404).json({message:'Course not found'});
 const reviews=await Review.find({course:course._id}).populate('student','name').sort({createdAt:-1});
 res.json({course,reviews});
}catch(e){next(e)}});
router.post('/',protect,allow('admin','instructor'),async(req,res,next)=>{try{
 const data={...req.body,instructor:req.user._id};const course=await Course.create(data);res.status(201).json(course);
}catch(e){next(e)}});
router.patch('/:id',protect,allow('admin','instructor'),async(req,res,next)=>{try{
 const course=await Course.findById(req.params.id);if(!course)return res.status(404).json({message:'Course not found'});
 if(req.user.role!=='admin' && !course.instructor.equals(req.user._id))return res.status(403).json({message:'You can only edit your own courses'});
 Object.assign(course,req.body);await course.save();res.json(course);
}catch(e){next(e)}});
router.delete('/:id',protect,allow('admin','instructor'),async(req,res,next)=>{try{
 const course=await Course.findById(req.params.id);if(!course)return res.status(404).json({message:'Course not found'});
 if(req.user.role!=='admin' && !course.instructor.equals(req.user._id))return res.status(403).json({message:'You can only delete your own courses'});
 await course.deleteOne();await Enrollment.deleteMany({course:course._id});await Review.deleteMany({course:course._id});res.json({message:'Course deleted'});
}catch(e){next(e)}});
router.post('/:id/enrol',protect,allow('student'),async(req,res,next)=>{try{
 const course=await Course.findById(req.params.id);if(!course||!course.published)return res.status(404).json({message:'Course not available'});
 const enrollment=await Enrollment.findOneAndUpdate({student:req.user._id,course:course._id},{$setOnInsert:{status:'pending'}},{upsert:true,new:true,setDefaultsOnInsert:true});res.status(201).json(enrollment);
}catch(e){if(e.code===11000)return res.status(409).json({message:'You already requested this course'});next(e)}});
router.post('/:id/reviews',protect,allow('student'),async(req,res,next)=>{try{
 const enrolled=await Enrollment.exists({student:req.user._id,course:req.params.id,status:'approved'});if(!enrolled)return res.status(403).json({message:'You must be enrolled to review this course'});
 const review=await Review.findOneAndUpdate({student:req.user._id,course:req.params.id},{rating:req.body.rating,comment:req.body.comment},{upsert:true,new:true,runValidators:true});res.status(201).json(review);
}catch(e){next(e)}});
export default router;
