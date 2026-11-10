import mongoose from 'mongoose';
import { ASSIGNMENT_STATUSES } from '../constants/index.js';
const schema=new mongoose.Schema({incidentId:{type:mongoose.Schema.Types.ObjectId,ref:'Incident',required:true,index:true},teamId:{type:mongoose.Schema.Types.ObjectId,ref:'ResponseTeam',required:true,index:true},assignedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},assignmentStatus:{type:String,enum:ASSIGNMENT_STATUSES,default:'Assigned',index:true},assignedAt:{type:Date,default:Date.now},acknowledgedAt:Date,enRouteAt:Date,onSceneAt:Date,completedAt:Date,lastUpdatedAt:{type:Date,default:Date.now},routeDistance:Number},{timestamps:true});
schema.index({teamId:1,assignmentStatus:1}); schema.index({incidentId:1,teamId:1},{unique:true});
export default mongoose.model('TeamAssignment',schema);
