import {sendJson,setPublicCache} from '../lib/http.js';
import {retrieveMonitoring} from '../lib/western-monarch-monitoring.js';

export default async function handler(req,res){
  setPublicCache(res,21600,43200); // Official counts update slowly; protect the museum from frequent queries.
  try {
    const data=await retrieveMonitoring();
    sendJson(res,200,data);
  } catch {
    sendJson(res,503,{generatedAt:new Date().toISOString(),sites:[],degraded:true,error:'Monitoring sources unavailable'});
  }
}
