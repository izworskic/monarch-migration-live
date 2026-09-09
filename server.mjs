import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const base='/national-tools/monarch-migration-live';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  let p=url.pathname;
  if(p.startsWith(base))p=p.slice(base.length)||'/';
  if(p.startsWith('/api/')){
    try{
      const name=p.slice('/api/'.length).replace(/[^a-z0-9-]/gi,'');
      const mod=await import(pathToFileURL(path.join(root,'api',`${name}.js`))+'?t='+Date.now());
      req.query=Object.fromEntries(url.searchParams.entries());
      return mod.default(req,res);
    }catch(e){res.statusCode=500;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({error:'Local API error',detail:e.message}));}
  }
  if(p==='/'||p==='')p='/index.html';
  const file=path.join(root,'public',p);
  if(!file.startsWith(path.join(root,'public'))){res.statusCode=403;return res.end('Forbidden');}
  try{await stat(file);const body=await readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.statusCode=404;res.end('Not found');}
});
server.listen(process.env.PORT||3000,()=>console.log(`Monarch Migration Live: http://localhost:${process.env.PORT||3000}${base}`));
