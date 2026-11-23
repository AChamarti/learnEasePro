import { Router } from 'express';
import Stripe from 'stripe';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { protect, allow } from '../middleware/auth.js';
const router=Router();
router.get('/session/:sessionId',protect,allow('student'),async(req,res,next)=>{try{if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({message:'Payments are not configured'});const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const session=await stripe.checkout.sessions.retrieve(req.params.sessionId);if(session.client_reference_id!==String(req.user._id))return res.status(403).json({message:'This checkout does not belong to your account'});if(session.payment_status==='paid'){const {studentId,courseId}=session.metadata||{};if(studentId!==String(req.user._id)||!courseId)return res.status(400).json({message:'Invalid checkout metadata'});const enrollment=await Enrollment.findOneAndUpdate({student:studentId,course:courseId},{$set:{status:'approved',enrolledAt:new Date()}},{upsert:true,new:true,setDefaultsOnInsert:true});return res.json({paid:true,enrollmentId:enrollment._id,courseId});}res.json({paid:false,status:session.payment_status});}catch(e){next(e)}});
router.post('/checkout/:courseId',protect,allow('student'),async(req,res,next)=>{try{
 if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({message:'Payments are not configured. Add STRIPE_SECRET_KEY to server/.env.'});
 const course=await Course.findOne({_id:req.params.courseId,published:true});if(!course)return res.status(404).json({message:'Course not available'});
 if(course.price<=0)return res.status(400).json({message:'This course is free. Use Request course access instead.'});
 const existing=await Enrollment.findOne({student:req.user._id,course:course._id,status:'approved'});if(existing)return res.status(409).json({message:'You already have access to this course'});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
 const session=await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],line_items:[{price_data:{currency:(process.env.PAYMENT_CURRENCY||'gbp').toLowerCase(),product_data:{name:course.title,description:course.subtitle||course.description.slice(0,250)},unit_amount:Math.round(course.price*100)},quantity:1}],success_url:`${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${process.env.CLIENT_URL}/courses/${course._id}?payment=cancelled`,client_reference_id:String(req.user._id),metadata:{studentId:String(req.user._id),courseId:String(course._id)}});
 res.json({url:session.url});
}catch(e){next(e)}});
export default router;
