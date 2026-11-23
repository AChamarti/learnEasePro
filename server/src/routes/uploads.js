import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect, allow } from '../middleware/auth.js';
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:500*1024*1024},fileFilter:(req,file,cb)=>{
 const ok=/^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime)|application\/(pdf|zip|vnd.openxmlformats-officedocument\..+)|text\/plain)$/.test(file.mimetype);
 cb(ok?null:new Error('Unsupported file type'),ok);
}});
router.post('/',protect,allow('admin','instructor'),upload.single('file'),async(req,res,next)=>{
 try{
  if(!req.file)return res.status(400).json({message:'Choose a file to upload'});
  const {CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET}=process.env;
  if(!CLOUDINARY_CLOUD_NAME||!CLOUDINARY_API_KEY||!CLOUDINARY_API_SECRET)return res.status(503).json({message:'File storage is not configured. Add Cloudinary credentials to server/.env.'});
  cloudinary.config({cloud_name:CLOUDINARY_CLOUD_NAME,api_key:CLOUDINARY_API_KEY,api_secret:CLOUDINARY_API_SECRET});
  const isVideo=req.file.mimetype.startsWith('video/');
  const result=await new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({resource_type:isVideo?'video':'auto',folder:'learnease-pro',use_filename:true,unique_filename:true},(err,data)=>err?reject(err):resolve(data));stream.end(req.file.buffer)});
  res.status(201).json({url:result.secure_url,publicId:result.public_id,resourceType:result.resource_type,originalName:req.file.originalname,bytes:result.bytes,format:result.format});
 }catch(e){next(e)}
});
export default router;
