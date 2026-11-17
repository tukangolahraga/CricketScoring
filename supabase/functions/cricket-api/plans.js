'use strict';
const PlanCore=(()=>{
const norm=s=>String(s).trim().toLowerCase().replace(/\s+/g,' ');
function id(p){return [p.ownTeam,p.opponent,p.format].map(norm).join('::')}
function validate(raw){const p=JSON.parse(JSON.stringify(raw));for(const k of ['ownTeam','opponent'])if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>120)throw Error('Nama tim rencana harus diisi (maks 120 karakter).');if(norm(p.ownTeam)===norm(p.opponent))throw Error('Tim sendiri dan lawan harus berbeda.');if(!['T10','T20','6s','Super8'].includes(p.format)||!Number.isInteger(p.overs)||p.overs<1||p.overs>50||!Number.isInteger(p.cap)||p.cap<1||p.cap>p.overs)throw Error('Format/over rencana tidak valid.');for(const k of ['planA','planB','fieldSetup','batting','review','evidence']){if(p[k]===undefined)p[k]='';if(typeof p[k]!=='string'||p[k].length>10000)throw Error('Catatan rencana terlalu panjang.');}if(!Array.isArray(p.schedule)||p.schedule.length!==p.overs)throw Error('Jumlah baris rencana over tidak sesuai.');p.schedule=p.schedule.map((r,i)=>{const x={over:i+1};for(const k of ['bowler','alternative','field','instruction']){x[k]=r[k]||'';if(typeof x[k]!=='string'||x[k].length>500)throw Error('Isian over terlalu panjang.');}return x;});p.id=id(p);p.updatedAt=typeof p.updatedAt==='string'?p.updatedAt:'';return p;}
function warnings(p){const out=[],count=new Map();let last='';for(const r of p.schedule){const name=norm(r.bowler);if(!name){last='';continue}if(name===last)out.push('Over '+r.over+': bowler sama dengan over sebelumnya.');last=name;count.set(name,(count.get(name)||0)+1);}for(const [name,n] of count)if(n>p.cap)out.push(name+': '+n+' over, melebihi cap '+p.cap+'.');return out;}
function collection(a){if(!Array.isArray(a)||a.length>200)throw Error('Maksimal 200 rencana.');const map=new Map();for(const p of a){const v=validate(p);if(map.has(v.id))throw Error('Rencana tim/lawan/format duplikat.');map.set(v.id,v);}return [...map.values()];}
return {norm,id,validate,warnings,collection};
})();
export {PlanCore};

