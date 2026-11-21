import assert from "node:assert/strict";
import {test,after} from "node:test";
import {once} from "node:events";
import {createHmac} from "node:crypto";
import express from "express";
import {autorizarSeed,destinoSeed} from "../prisma/seed-seguridad.js";
import {proxiesConfiables} from "../src/config/proxy.js";
import {identificarCliente,rateLimit} from "../src/middlewares/limitar-solicitudes.js";
process.env.DATABASE_URL="postgresql://test:test@127.0.0.1:1/test?connect_timeout=1";
process.env.DIRECT_URL=process.env.DATABASE_URL;
process.env.JWT_SECRET="solo-pruebas-aisladas-tattoomanager-32-bytes";
process.env.API_PROXY_SECRET="firma-de-proxy-exclusiva-de-pruebas-32-bytes";
const {app}=await import("../src/app.js");const {prisma}=await import("../src/config/prisma.js");
const server=app.listen(0,"127.0.0.1");await once(server,"listening");const addr=server.address();assert.ok(addr&&typeof addr==='object');const base="http://127.0.0.1:"+addr.port;
after(async()=>{await new Promise<void>(r=>server.close(()=>r()));await prisma.$disconnect();});
test("rutas antiguas: no leen perfiles ni distribuyen consultas",async()=>{
 assert.equal((await fetch(base+"/api/ubicaciones/artistas-cercanos?lat=0&lng=0&radio=1000000")).status,404);
 assert.equal((await fetch(base+"/api/consultas/publicas/cercanas",{method:"POST",headers:{"Content-Type":"application/json"},body:'{}'})).status,410);
 assert.equal((await fetch(base+"/api/paginas/configuracion")).status,401);
});
test("registro: límite compartido por rutas de registro y Google",async()=>{
 const routes=["/register","/register-artist","/google/registro"];
 for(let i=0;i<10;i++)assert.notEqual((await fetch(base+"/api/auth"+routes[i%3],{method:"POST",headers:{"Content-Type":"application/json"},body:'{}'})).status,429);
 assert.equal((await fetch(base+"/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:'{}'})).status,429);
});
test("IPs firmadas separan límites; falsificaciones, firmas vencidas y de otra ruta no lo eluden",async()=>{
 const a=express();a.use(identificarCliente);a.post("/api/prueba",rateLimit({windowMs:60_000,limit:2}),(_q,r)=>r.json({ok:true}));
 const s=a.listen(0,"127.0.0.1");await once(s,"listening");const address=s.address();assert.ok(address&&typeof address==='object');
 const sign=(ip:string,ts=Date.now(),path="/api/prueba")=>{const time=String(ts);return {"x-tattoo-client-ip":ip,"x-tattoo-proxy-time":time,"x-tattoo-proxy-signature":createHmac("sha256",process.env.API_PROXY_SECRET!).update([time,ip,"POST",path].join("\n")).digest("hex")};};
 const request=(headers:Record<string,string>)=>fetch("http://127.0.0.1:"+address.port+"/api/prueba",{method:"POST",headers});
 try {
  assert.equal((await request(sign("203.0.113.1"))).status,200);assert.equal((await request(sign("203.0.113.1"))).status,200);assert.equal((await request(sign("203.0.113.1"))).status,429);
  assert.equal((await request(sign("203.0.113.2"))).status,200);
  assert.equal((await request({...sign("203.0.113.3"),"x-tattoo-proxy-signature":"0".repeat(64)})).status,200);
  assert.equal((await request(sign("203.0.113.4",Date.now()-120_000))).status,200);
  assert.equal((await request(sign("203.0.113.5",Date.now(),"/api/otra"))).status,429);
 }finally{await new Promise<void>(r=>s.close(()=>r()));}
});
test("solo se confía en proxies concretos, nunca en cualquier visitante",()=>{
 assert.equal(proxiesConfiables({}),false);assert.deepEqual(proxiesConfiables({TRUSTED_PROXY_CIDRS:"127.0.0.1/32,::1/128"}),["127.0.0.1/32","::1/128"]);
 for(const value of ["true","1","0.0.0.0/0","::/0","203.0.113.1/33"])assert.throws(()=>proxiesConfiables({TRUSTED_PROXY_CIDRS:value}));
});
test("seed: producción bloqueada, habilitación y destino exacto obligatorios",()=>{
 const DATABASE_URL="postgresql://seed:clave@127.0.0.1:5432/tattoo_dev",huella=destinoSeed(DATABASE_URL).huella;
 for(const env of [{DATABASE_URL},{DATABASE_URL,NODE_ENV:"development",SEED_ENABLED:"1"},{DATABASE_URL,NODE_ENV:"production",SEED_ENABLED:"1",SEED_DATABASE_FINGERPRINT:huella},{DATABASE_URL,NODE_ENV:"test",SEED_ENABLED:"1",SEED_DATABASE_FINGERPRINT:"otra-base"}])assert.throws(()=>autorizarSeed(env));
 assert.equal(autorizarSeed({DATABASE_URL,NODE_ENV:"test",SEED_ENABLED:"1",SEED_DATABASE_FINGERPRINT:huella}).base,"tattoo_dev");assert.notEqual(destinoSeed(DATABASE_URL.replace('seed:','otro:')).huella,huella);
});
