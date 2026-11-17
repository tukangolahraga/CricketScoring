'use strict';
const CPL=(()=>{
const formats={T10:{overs:10,players:11,cap:2},T20:{overs:20,players:11,cap:4},'6s':{overs:5,players:6,cap:2},Super8:{overs:14,players:8,cap:3}};
const copy=x=>JSON.parse(JSON.stringify(x)),norm=x=>String(x).trim().toLowerCase().replace(/\s+/g,' '),key=(t,p)=>p.uid?'uid:'+p.uid:norm(t.name)+'::'+norm(p.name);
const legal=e=>typeof e.countsBall==='boolean'?e.countsBall:!['wide','noball'].includes(e.extra),batRuns=e=>['normal','noball'].includes(e.extra)?e.runs:0;
const total=e=>e.runs+(['wide','noball'].includes(e.extra)?(e.penaltyRuns??1):0)+(e.extra==='noball'?(e.extraRuns||0):0);
const conceded=e=>total(e)-(['bye','legbye'].includes(e.extra)?e.runs:e.extra==='noball'?(e.extraRuns||0):0);
const credit=e=>e.wicket!=='none'&&!['runout','obstructing','hittwice','retiredout'].includes(e.wicket);
const over=n=>Math.floor(n/6)+'.'+n%6;
function rules(m){return m.rules||formats[m.matchFormat]||formats.T20}
function countsBall(e,r,balls){if(!['wide','noball'].includes(e.extra))return true;const mode=r.extraBallMode||'standard';return mode==='count_all'||(mode==='repeat_last'&&Math.floor(balls/6)<r.overs-1)}
function stats(m,i){const inn=m.innings[i],r=rules(m),bat=Object.create(null),bowl=Object.create(null);m.teams[inn.batting].players.forEach(p=>bat[p.id]={runs:0,balls:0,fours:0,sixes:0,out:false});m.teams[1-inn.batting].players.forEach(p=>bowl[p.id]={balls:0,runs:0,wickets:0});let runs=0,wickets=0,balls=0,extras=0,free=false;
for(const e of inn.events){const b=bat[e.striker],w=bowl[e.bowler];runs+=total(e);extras+=total(e)-batRuns(e);b.runs+=batRuns(e);if(e.extra!=='wide')b.balls++;if(batRuns(e)===4)b.fours++;if(batRuns(e)===6)b.sixes++;w.runs+=conceded(e);if(countsBall(e,r,balls)){balls++;w.balls++}if(e.wicket!=='none'){wickets++;bat[e.dismissed].out=true;if(credit(e))w.wickets++}if(e.extra==='noball'&&r.freeHit!==false)free=true;else if(!['wide','noball'].includes(e.extra))free=false;}
return {runs,wickets,balls,extras,bat,bowl,free};}
function fresh(m,batting){return {batting,events:[],striker:m.teams[batting].players[0].id,nonStriker:m.teams[batting].players[1].id,ended:false,reason:''}}
function create(teams,format,custom={},first=0){const m={schema:'CPL_MAE_1',id:globalThis.crypto?.randomUUID?.()||String(Date.now()),created:new Date().toISOString(),matchFormat:format,rules:{...formats[format],freeHit:true,...custom},teams,innings:[]};m.innings=[fresh(m,first)];return validate(m);}
function append(m,input){const i=m.innings.length-1,inn=m.innings[i],s=stats(m,i),r=rules(m),e={extra:'normal',runs:0,extraRuns:0,wicket:'none',dismissed:'',style:'unknown',length:'unknown',line:'unknown',shot:'unknown',...input};
const fail=msg=>{throw Error(msg)};
if(inn.ended)fail('Innings sudah selesai.');
e.countsBall=countsBall(e,r,s.balls);
if(e.penaltyRuns!==undefined&&(!['wide','noball'].includes(e.extra)||!Number.isInteger(e.penaltyRuns)||e.penaltyRuns<0||e.penaltyRuns>12))fail('Penalti extras harus 0–12 dan hanya untuk wide/no-ball.');
if(!Number.isInteger(e.runs)||e.runs<0||e.runs>12||!Number.isInteger(e.extraRuns)||e.extraRuns<0||e.extraRuns>12)fail('Runs harus bilangan bulat 0–12.');
if(!['normal','wide','noball','bye','legbye'].includes(e.extra)||!['none','bowled','caught','lbw','stumped','hitwicket','runout','obstructing','hittwice'].includes(e.wicket))fail('Jenis delivery tidak dikenal.');
if(!s.bat[e.striker]||!s.bat[e.nonStriker]||e.striker===e.nonStriker||s.bat[e.striker].out||s.bat[e.nonStriker].out)fail('Pilih dua batter aktif yang berbeda.');
if(!s.bowl[e.bowler])fail('Pilih bowler.');
if(s.bowl[e.bowler].balls>=r.cap*6)fail('Batas over bowler tercapai.');
const current=inn.events.filter(x=>x.overIndex===Math.floor(s.balls/6));
if(current.length&&current[0].bowler!==e.bowler)fail('Bowler harus sama sepanjang over.');
if(!current.length&&inn.events.length&&inn.events.at(-1).bowler===e.bowler)fail('Bowler tidak boleh dua over berturut-turut.');
if(e.extra!=='noball'&&e.extraRuns)fail('Extra tambahan hanya untuk no-ball.');
if(e.extra==='noball'&&e.runs&&e.extraRuns)fail('No-ball: runs bat dan bye/leg-bye tidak dapat bersamaan.');
if(['bye','legbye'].includes(e.extra)&&!e.runs)fail('Bye/leg-bye minimal 1.');
if(e.wicket!=='none'){
if(![e.striker,e.nonStriker].includes(e.dismissed))fail('Pilih batter yang out.');
if(e.wicket!=='runout'&&e.dismissed!==e.striker)fail('Dismissal ini hanya untuk striker.');
if((e.extra==='noball'||s.free)&&!['runout','obstructing','hittwice'].includes(e.wicket))fail('Dismissal tidak sah pada no-ball/free hit.');
if(e.extra==='wide'&&!['runout','stumped','hitwicket','obstructing'].includes(e.wicket))fail('Dismissal tidak sah pada wide.');
if(['bowled','caught','lbw','stumped','hitwicket','hittwice'].includes(e.wicket)&&(e.runs||e.extraRuns))fail('Dismissal ini tidak mendukung tambahan runs.');
if(['bye','legbye'].includes(e.extra)&&!['runout','obstructing'].includes(e.wicket))fail('Gunakan run-out/obstructing untuk bye atau leg-bye.');
}
e.overIndex=Math.floor(s.balls/6);e.at=e.at||new Date().toISOString();
let a=e.striker,b=e.nonStriker;const crossed=e.crossed===undefined?((e.runs+(e.extra==='noball'?e.extraRuns:0))%2===1):e.crossed;
if(crossed)[a,b]=[b,a];
const willEnd=s.wickets+(e.wicket!=='none'?1:0)>=r.players-1||s.balls+(legal(e)?1:0)>=r.overs*6||(i===1&&s.runs+total(e)>=stats(m,0).runs+1);
if(e.wicket!=='none'&&!willEnd){if(!e.next||!s.bat[e.next]||s.bat[e.next].out||[e.striker,e.nonStriker].includes(e.next))fail('Pilih batter baru yang belum out.');if(a===e.dismissed)a=e.next;else b=e.next;}
if(legal(e)&&(s.balls+1)%6===0)[a,b]=[b,a];
inn.events.push(e);inn.striker=a;inn.nonStriker=b;
if(willEnd){inn.ended=true;inn.reason=i===1&&s.runs+total(e)>stats(m,0).runs?'Target tercapai':s.wickets+(e.wicket!=='none'?1:0)>=r.players-1?'All out':'Batas over';}
return e;}
function next(m){if(m.innings.length!==1||!m.innings[0].ended)throw Error('Akhiri innings pertama dahulu.');m.innings.push(fresh(m,1-m.innings[0].batting));}
function result(m){const i=m.innings.length-1,s=stats(m,i),r=rules(m);if(!i)return m.innings[0].ended?'Jeda innings • Target '+(s.runs+1):'Innings pertama • '+r.overs+' over';const first=stats(m,0),target=first.runs+1;if(s.runs>=target)return m.teams[m.innings[1].batting].name+' menang '+(r.players-1-s.wickets)+' wicket';if(m.innings[1].ended)return s.runs===first.runs?'Seri (tie)':m.teams[m.innings[0].batting].name+' menang '+(first.runs-s.runs)+' runs';return 'Target '+target+' • perlu '+(target-s.runs)+' dari '+(r.overs*6-s.balls)+' bola • RRR '+((target-s.runs)*6/Math.max(1,r.overs*6-s.balls)).toFixed(2);}
function validate(raw){const m=copy(raw);if(!m||!m.id||!Array.isArray(m.teams)||m.teams.length!==2||!Array.isArray(m.innings)||m.innings.length<1||m.innings.length>2)throw Error('Struktur match tidak valid.');const oldSixes=m.matchFormat==='SIXES';m.matchFormat=oldSixes?'6s':m.matchFormat==='SUPER8'?'Super8':m.matchFormat;if(oldSixes&&!m.rules)m.rules={...formats['6s'],cap:5,freeHit:true};const r=rules(m);if(!formats[m.matchFormat]||!Number.isInteger(r.overs)||r.overs<1||r.overs>50||!Number.isInteger(r.players)||r.players<2||r.players>11||!Number.isInteger(r.cap)||r.cap<1||r.cap>r.overs)throw Error('Aturan format tidak valid.');if(r.extraBallMode!==undefined&&!['standard','repeat_last','count_all'].includes(r.extraBallMode))throw Error('Aturan pengulangan extras tidak valid.');m.rules={...r};
const ids=new Set();for(const t of m.teams){if(typeof t.name!=='string'||!t.name.trim()||!Array.isArray(t.players)||t.players.length!==r.players)throw Error('Jumlah pemain tidak sesuai format.');const names=new Set();for(const p of t.players){if(typeof p.id!=='string'||typeof p.name!=='string'||!p.name.trim()||ids.has(p.id)||names.has(norm(p.name)))throw Error('ID/nama pemain tidak valid atau duplikat.');ids.add(p.id);names.add(norm(p.name));}}
if(norm(m.teams[0].name)===norm(m.teams[1].name))throw Error('Nama tim harus berbeda.');
const original=copy(m.innings);m.innings=[];
for(let ix=0;ix<original.length;ix++){const inn=original[ix];if(![0,1].includes(inn.batting)||!Array.isArray(inn.events)||inn.events.length>2000||(ix&&(!m.innings[0].ended||inn.batting===m.innings[0].batting)))throw Error('Urutan innings tidak valid.');m.innings.push(fresh(m,inn.batting));
for(let j=0;j<inn.events.length;j++){const e=copy(inn.events[j]);e.extraRuns=e.extraRuns||0;e.wicket=e.wicket||'none';if(e.wicket!=='none'&&!e.next){const later=inn.events[j+1];const active=[e.striker,e.nonStriker];e.next=later?[later.striker,later.nonStriker].find(x=>!active.includes(x)):m.teams[inn.batting].players.find(p=>!active.includes(p.id)&&!stats(m,ix).bat[p.id].out)?.id;}append(m,e);}
const rebuilt=m.innings[ix];if(inn.ended&&!rebuilt.ended){rebuilt.ended=true;rebuilt.reason=inn.reason||'Diakhiri manual';}if(!rebuilt.ended&&inn.striker&&inn.nonStriker){const s=stats(m,ix);if(s.bat[inn.striker]&&!s.bat[inn.striker].out&&s.bat[inn.nonStriker]&&!s.bat[inn.nonStriker].out&&inn.striker!==inn.nonStriker){rebuilt.striker=inn.striker;rebuilt.nonStriker=inn.nonStriker;}}
}return m;}
function dedup(matches){const seen=new Map(),fingerprints=new Set(),out=[];for(const m of matches){const fingerprint=JSON.stringify([m.created,m.teams.map(t=>[norm(t.name),t.players.map(p=>norm(p.name))]),m.innings.map(i=>[i.batting,i.events.map(e=>[e.striker,e.nonStriker,e.bowler,e.runs,e.extra,e.extraRuns||0,e.penaltyRuns??1,e.countsBall,e.wicket,e.dismissed||''])])]);if(seen.has(String(m.id))||fingerprints.has(fingerprint))continue;seen.set(String(m.id),true);fingerprints.add(fingerprint);out.push(m)}return out;}
function rows(matches){const out=[];for(const m of dedup(matches))for(const [ix,inn] of m.innings.entries())for(const e of inn.events){const bt=m.teams[inn.batting],wt=m.teams[1-inn.batting],p=bt.players.find(p=>p.id===e.striker),w=wt.players.find(p=>p.id===e.bowler);out.push({...e,matchId:String(m.id),format:m.matchFormat,batKey:key(bt,p),bowlKey:key(wt,w),batName:p.name,bowlName:w.name,batTeam:bt.name,bowlTeam:wt.name,innings:ix+1});}return out;}
function profile(es){const runs=es.reduce((n,e)=>n+batRuns(e),0),balls=es.filter(e=>e.extra!=='wide').length,lb=es.filter(legal).length;return {n:es.length,runs,balls,sr:balls?100*runs/balls:null,dots:es.filter(e=>legal(e)&&total(e)===0).length,legal:lb,wickets:es.filter(credit).length,conceded:es.reduce((n,e)=>n+conceded(e),0),matches:new Set(es.map(e=>e.matchId)).size};}
function csvParse(str){const out=[];let row=[],s='',quoted=false;str=str.replace(/^\uFEFF/,'');for(let i=0;i<str.length;i++){const c=str[i];if(c==='"'){if(quoted&&str[i+1]==='"'){s+='"';i++}else quoted=!quoted;}else if(c===','&&!quoted){row.push(s);s='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&str[i+1]==='\n')i++;row.push(s);out.push(row);row=[];s='';}else s+=c;}if(quoted)throw Error('CSV: tanda kutip tidak ditutup.');if(s||row.length){row.push(s);out.push(row)}return out;}
return {formats,copy,norm,key,legal,countsBall,batRuns,total,conceded,credit,over,rules,stats,fresh,create,append,next,result,validate,dedup,rows,profile,csvParse};
})();
export {CPL};
