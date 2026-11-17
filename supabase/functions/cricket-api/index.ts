import { CPL } from './engine.js';
import { PlanCore } from './plans.js';
const base=Deno.env.get('SUPABASE_URL')!;
const secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY')!;
const allowed='https://tukangolahraga.github.io';
const uuid=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
function text(x:unknown,max=120){if(typeof x!=='string'||!x.trim()||x.length>max)throw Error('Isian teks tidak valid.');return x.trim()}
async function db(path:string,method='GET',body?:unknown){const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:secret,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json().catch(()=>null);if(!r.ok)throw Error(data?.message||'Database error');return data}
async function user(req:Request){const token=req.headers.get('Authorization')||'';if(!token.startsWith('Bearer '))throw Error('LOGIN_REQUIRED');const r=await fetch(base+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:token}});const u=await r.json();if(!r.ok||!u.id||u.is_anonymous||!u.email_confirmed_at)throw Error('LOGIN_REQUIRED: verifikasi email dahulu.');return u.id as string}
async function hash(x:unknown){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function handle(req:Request){const origin=req.headers.get('Origin');const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store'};const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
if(origin&&origin!==allowed)return reply({error:'Origin tidak diizinkan.'},403);
if(req.method==='OPTIONS')return new Response('ok',{headers});
try{
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const actor=await user(req);const raw=await req.text();if(new TextEncoder().encode(raw).length>2000000)throw Error('Maksimal data 2 MB.');const body=JSON.parse(raw);
 if(body.action==='myTeams')return reply({rows:await db('rpc/cpl_my_teams','POST',{p_actor:actor})});
 if(body.action==='invite'){if(!uuid(body.team))throw Error('ID tim tidak valid');const token=crypto.randomUUID();await db('rpc/cpl_create_invite','POST',{p_actor:actor,p_team:body.team,p_hash:await hash(token)});return reply({token,expires:'7 hari',singleUse:true})}
 if(body.action==='joinTeam'){return reply(await db('rpc/cpl_join_team','POST',{p_actor:actor,p_hash:await hash(text(body.token,100))}))}
 if(body.action==='registerTeam'){const name=text(body.name),country=text(body.country,2).toUpperCase(),region=typeof body.region==='string'?body.region.trim().slice(0,120):'';if(!/^[A-Z]{2}$/.test(country))throw Error('Kode negara harus 2 huruf.');return reply(await db('rpc/cpl_register_team','POST',{p_actor:actor,p_name:name,p_country:country,p_region:region}))}
 if(body.action==='registerPlayer'){const name=text(body.name),country=body.country?text(body.country,2).toUpperCase():null;const rows=await db('cpl_players','POST',{display_name:name,country_code:country,created_by:actor});return reply(rows[0])}
 if(body.action==='mine')return reply({matches:await db('cpl_match_snapshots?owner_id=eq.'+actor+'&select=id,local_match_key,revision,updated_at,payload&order=updated_at.desc&limit=100'),plans:await db('cpl_private_plans?owner_id=eq.'+actor+'&select=id,revision,payload&limit=200')});
 if(body.action==='savePlan'){const p=PlanCore.validate(body.plan);p.registryOwn=body.own;p.registryOpponent=body.opponent;p.registryKey=[body.own,body.opponent,p.format].join('::');if(!uuid(body.own)||!uuid(body.opponent)||!Number.isInteger(body.revision)||body.revision<0)throw Error('ID tim/revisi rencana tidak valid.');return reply(await db('rpc/cpl_save_plan','POST',{p_actor:actor,p_own:body.own,p_opponent:body.opponent,p_format:p.format,p_expected:body.revision,p_payload:p}))}
 if(body.action==='saveDraft'){
   const m=CPL.validate(body.match);
   if(!uuid(body.requestId)||!Number.isInteger(body.revision)||body.revision<0)throw Error('Permintaan/revisi draft tidak valid.');
   m.result_text=CPL.result(m);
   if(Array.isArray(body.teams)&&body.teams.length===2&&body.teams.every(uuid))m.registry_teams=body.teams;
   const digest=await hash({m,revision:body.revision});
   return reply(await db('rpc/cpl_save_account_draft','POST',{p_actor:actor,p_local_key:text(String(m.id)),p_expected:body.revision,p_request:body.requestId,p_hash:digest,p_payload:m}));
 }
 if(body.action==='saveMatch'){
   const m=CPL.validate(body.match);if(!Array.isArray(body.teams)||body.teams.length!==2||!body.teams.every(uuid)||body.teams[0]===body.teams[1]||!uuid(body.requestId)||!Number.isInteger(body.revision)||body.revision<0)throw Error('ID tim/permintaan/revisi tidak valid.');
   const memberships=await db('rpc/cpl_my_teams','POST',{p_actor:actor});if(!memberships.some((t:any)=>body.teams.includes(t.id)))throw Error('TEAM_ACCESS_REQUIRED: bergabung ke tim melalui undangan pengelola.');
   const roster=m.teams.flatMap((t:any)=>t.players);if(!roster.every((p:any)=>uuid(p.uid))||new Set(roster.map((p:any)=>p.uid)).size!==roster.length)throw Error('Pilih ID registri berbeda untuk seluruh pemain.');
   const known=await db('cpl_players?select=id&id=in.('+roster.map((p:any)=>p.uid).join(',')+')');if(known.length!==roster.length)throw Error('Pemain tidak ditemukan di registri.');
   const teams=await db('cpl_teams?select=id,display_name&id=in.('+body.teams.join(',')+')');if(teams.length!==2)throw Error('Tim registri tidak ditemukan.');
   m.teams.forEach((t:any,i:number)=>{t.name=teams.find((x:any)=>x.id===body.teams[i]).display_name});
   const stats:any[]=[];for(const [ix,inn]of m.innings.entries()){const s=CPL.stats(m,ix);m.teams.forEach((t:any,slot:number)=>t.players.forEach((p:any)=>{const b=s.bat[p.id],w=s.bowl[p.id];stats.push({player_id:p.uid,team_id:body.teams[slot],innings:ix+1,batting_runs:b?.runs||0,balls_faced:b?.balls||0,fours:b?.fours||0,sixes:b?.sixes||0,dismissed:b?.out||false,bowling_legal_balls:w?.balls||0,runs_conceded:w?.runs||0,wickets:w?.wickets||0})}))}
   if(body.publish&&(m.innings.length!==2||!m.innings[1].ended))throw Error('Selesaikan kedua innings sebelum publikasi.');
   m.result_text=CPL.result(m);m.registry_teams=body.teams;const date=typeof body.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(body.date)?body.date:new Date().toISOString().slice(0,10);
   const digest=await hash({m,teams:body.teams,publish:!!body.publish,revision:body.revision,date});return reply(await db('rpc/cpl_commit_match','POST',{p_actor:actor,p_local_key:String(m.id).slice(0,120),p_expected:body.revision,p_request:body.requestId,p_hash:digest,p_payload:m,p_stats:stats,p_publish:!!body.publish,p_team_a:body.teams[0],p_team_b:body.teams[1],p_date:date}));
 }
 throw Error('Aksi tidak dikenal.');
}catch(e){const msg=String(e instanceof Error?e.message:e);return reply({error:msg},msg.includes('LOGIN_REQUIRED')?401:msg.includes('TEAM_ACCESS_REQUIRED')?403:msg.includes('CONFLICT')?409:400)}
}
Deno.serve(handle);

