import mongoose from 'mongoose';
import { TEAM_CATEGORIES } from '../constants/index.js';
const point=new mongoose.Schema({type:{type:String,enum:['Point'],default:'Point'},coordinates:{type:[Number],validate:{validator:v=>!v||v.length===2}}},{_id:false});
const schema=new mongoose.Schema({teamName:{type:String,required:true,trim:true,maxlength:120},teamId:{type:String,required:true,unique:true,index:true,trim:true,uppercase:true,maxlength:40},category:{type:String,enum:TEAM_CATEGORIES,required:true,index:true},userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true,index:true},baseLocation:{address:{type:String,maxlength:300},location:point},currentLocation:{type:point,default:undefined},locationUpdatedAt:Date,isOnDuty:{type:Boolean,default:false,index:true},availabilityStatus:{type:String,enum:['Off Duty','Available','Busy'],default:'Off Duty',index:true},isActive:{type:Boolean,default:true,index:true},contactNumber:{type:String,maxlength:30},description:{type:String,maxlength:1000}},{timestamps:true});
schema.index({currentLocation:'2dsphere'},{sparse:true});
export default mongoose.model('ResponseTeam',schema);
