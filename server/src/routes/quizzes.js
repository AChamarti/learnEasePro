import { Router } from 'express';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { protect, allow } from '../middleware/auth.js';
const router = Router();
router.use(protect);
async function canManage(course, user) { return user.role === 'admin' || course.instructor.equals(user._id);
}
async function canLearn(courseId, user) { return user.role === 'admin' || !!(await Enrollment.exists({ course: courseId, student: user._id, status: 'approved' }));
}
function publicQuiz(q) { const x=q.toObject();
x.questions=x.questions.map(({_id,prompt,options,explanation})=>({_id,prompt,options,explanation}));
return x;
}
router.get('/course/:courseId', async (req,res,next)=>{try{
 const course=await Course.findById(req.params.courseId); if(!course)return res.status(404).json({message:'Course not found'});
 if(!await canLearn(course._id,req.user) && !await canManage(course,req.user))return res.status(403).json({message:'Approved course access required'});
 const quizzes=await Quiz.find({course:course._id}).sort({createdAt:1});
 res.json(quizzes.map(q=>({ ...publicQuiz(q), questions:q.questions.map(({_id,prompt,options})=>({_id,prompt,options})) })));
}catch(e){next(e)}});
router.post('/course/:courseId',allow('admin','instructor'),async(req,res,next)=>{try{
 const course=await Course.findById(req.params.courseId); if(!course)return res.status(404).json({message:'Course not found'});
 if(!await canManage(course,req.user))return res.status(403).json({message:'You can only add quizzes to your own courses'});
 const quiz=await Quiz.create({...req.body,course:course._id,createdBy:req.user._id});res.status(201).json(publicQuiz(quiz));
}catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{
 const q=await Quiz.findById(req.params.id);if(!q)return res.status(404).json({message:'Quiz not found'});
 const course=await Course.findById(q.course);if(!course || (!await canLearn(course._id,req.user)&&!await canManage(course,req.user)))return res.status(403).json({message:'Course access required'});
 res.json(publicQuiz(q));
}catch(e){next(e)}});
router.post('/:id/attempts',allow('student'),async(req,res,next)=>{try{
 const q=await Quiz.findById(req.params.id);if(!q)return res.status(404).json({message:'Quiz not found'});
 if(!await canLearn(q.course,req.user))return res.status(403).json({message:'Approved course access required'});
 const answers=Array.isArray(req.body.answers)?req.body.answers:[];
 if(answers.length!==q.questions.length || answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=q.questions[i].options.length))return res.status(400).json({message:'Please answer every question with a valid option'});
 const correct=answers.reduce((n,a,i)=>n+(a===q.questions[i].correctIndex?1:0),0);const score=Math.round(correct/q.questions.length*100);
 const attempt=await QuizAttempt.create({quiz:q._id,course:q.course,student:req.user._id,answers,score,passed:score>=q.passMark});
 res.status(201).json({score,passed:attempt.passed,passMark:q.passMark,correct,total:q.questions.length,submittedAt:attempt.submittedAt,review:q.questions.map((x,i)=>({correctIndex:x.correctIndex,explanation:x.explanation,selectedIndex:answers[i]}))});
}catch(e){next(e)}});
router.get('/:id/my-attempts',allow('student'),async(req,res,next)=>{try{res.json(await QuizAttempt.find({quiz:req.params.id,student:req.user._id}).sort({createdAt:-1}).select('-answers'))}catch(e){next(e)}});
export default router;
