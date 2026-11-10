import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api.js';

const allowed = new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['application/pdf','pdf']]);
const cleanName = name => path.basename(name || 'attachment').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180) || 'attachment';
const storage = multer.diskStorage({destination:async (_req,_file,cb)=>{try{await fs.mkdir(env.uploadDir,{recursive:true});cb(null,env.uploadDir);}catch(e){cb(e);}},filename:(_req,file,cb)=>cb(null,`${crypto.randomUUID()}${path.extname(cleanName(file.originalname)).toLowerCase()}`)});
const rawUpload=multer({storage,limits:{files:5,fileSize:10*1024*1024,fieldSize:100*1024},fileFilter:(_req,file,cb)=>cb(allowed.has(file.mimetype)?null:new ApiError(422,'INVALID_ATTACHMENT','Only JPG, PNG, WEBP, and PDF attachments are allowed'))}).array('attachments',5);
export const hasAllowedSignature=(buffer,type)=>(type==='image/jpeg'&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)||(type==='image/png'&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(type==='image/webp'&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')||(type==='application/pdf'&&buffer.subarray(0,5).toString()==='%PDF-');
export const cleanupUploads=async files=>Promise.all((files||[]).map(f=>fs.unlink(f.path).catch(()=>{})));
export const uploadAttachments=(req,res,next)=>rawUpload(req,res,async err=>{if(err){if(req.files)await cleanupUploads(req.files);if(err instanceof multer.MulterError)return next(new ApiError(422,'UPLOAD_LIMIT',err.code==='LIMIT_FILE_SIZE'?'Each attachment must be 10 MB or smaller':'A maximum of five attachments is allowed'));return next(err);}try{if((req.files||[]).reduce((sum,file)=>sum+file.size,0)>25*1024*1024)throw new ApiError(422,'UPLOAD_LIMIT','Attachments must not exceed 25 MB in total');for(const file of req.files||[]){const header=await fs.readFile(file.path);if(!hasAllowedSignature(header,file.mimetype))throw new ApiError(422,'INVALID_ATTACHMENT','Attachment content does not match an allowed file type');file.originalname=cleanName(file.originalname);}next();}catch(e){await cleanupUploads(req.files);next(e);}});
export const attachmentMetadata=(files,userId)=>(files||[]).map(file=>({attachmentId:crypto.randomUUID(),originalName:cleanName(file.originalname),storedName:file.filename,mimeType:file.mimetype,size:file.size,storagePath:file.filename,uploadedBy:userId,uploadedAt:new Date()}));
export const attachmentPath=attachment=>{const resolved=path.resolve(env.uploadDir,attachment.storagePath);if(!resolved.startsWith(`${env.uploadDir}${path.sep}`))throw new ApiError(404,'NOT_FOUND','Attachment not found');return resolved;};
