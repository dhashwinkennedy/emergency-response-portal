import BackgroundJob from '../models/BackgroundJob.js';
export const enqueue=(jobType,payload)=>BackgroundJob.create({jobType,payload});
export async function claimJob(){ await BackgroundJob.updateMany({status:'processing',lockedAt:{$lt:new Date(Date.now()-10*60e3)}},{status:'queued',lockedAt:null}); return BackgroundJob.findOneAndUpdate({status:'queued',scheduledAt:{$lte:new Date()}},{status:'processing',lockedAt:new Date(),$inc:{attempts:1}},{sort:{scheduledAt:1},new:true}); }
