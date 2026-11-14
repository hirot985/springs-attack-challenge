'use strict';
const $=id=>document.getElementById(id), screens=[...document.querySelectorAll('.screen')];
let bonusRound=false,rouletteStart=0,rouletteEnd=0;
let screen='home',round=0,scores=[], phase='ready',tossStart=0,hitStart=0,hitQuality=0,hitElapsed=0,transitionTimer=0,timers=[],sound=false,audioCtx,stream=null,frame=0,capturedUrl=null,winning=false,cleared=false,lockedUntil=0;
const canvas=$('court'),ctx=canvas.getContext('2d'),W=390,H=450;
const athlete=new Image();athlete.onload=()=>{['hero-avatar','bonus-player'].forEach(id=>$(id).getContext('2d').drawImage(athlete,0,0,800,1024,0,0,800,1024))};athlete.src='assets/athletes.png';
const frameColors=['#0878ce','#d94288','#088e95','#6458bc','#2366a5','#008e79','#d9811c','#5762bf','#ce517e','#0c98b8','#a84ca7','#316ab8','#16866b','#bb5763','#4b7cba','#8d63b0','#23768e','#e49327','#32445f'];
function later(fn,ms){let t=setTimeout(fn,ms);timers.push(t);return t}function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function show(id){screens.forEach(x=>x.classList.toggle('active',x.id===id));$('game').classList.toggle('party-mode',id==='game'&&bonusRound);screen=id;lockedUntil=performance.now()+550;window.scrollTo(0,0)}
function gate(fn){return e=>{if(performance.now()<lockedUntil)return;fn(e)}}
function tone(freq=600,dur=.1,type='sine',vol=.08){if(!sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}
function fanfare(){[523,659,784,1047].forEach((f,i)=>later(()=>tone(f,.2,'triangle'),i*100))}
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♪ ON':'♪ OFF';tone()};
$('about').onclick=()=> $('spec-modal').showModal();$('close-spec').onclick=()=> $('spec-modal').close();
$('start').onclick=gate(()=>{clearTimers();scores=[];round=0;bonusRound=false;show('tutorial');tone(600)});
$('play').onclick=gate(()=>{show('game');nextRound()});
function nextRound(){phase='ready';document.querySelector('#perfect-cutin strong').innerHTML=bonusRound?'BONUS<br><em>SPIKE!</em>':'PERFECT<br><em>SPIKE!</em>';document.querySelector('.total').style.visibility=bonusRound?'hidden':'';$('perfect-cutin').classList.remove('active');$('hit-rating').classList.remove('show');$('round-label').innerHTML=bonusRound?'BONUS':(round+1)+'<small>/ 3</small>';$('score-label').textContent=scores.reduce((a,b)=>a+b,0);[...$('round-dots').children].forEach((x,i)=>x.className=i<round?'done':i===round?'current':'');$('game-message').textContent=['1st ATTACK!','2nd ATTACK!','LAST ATTACK!'][round];$('attack').disabled=true;$('attack').textContent='トスを待ってね';$('game-hint').textContent='ボールがリングに重なったら画面をタップ！';tone(430,.15);later(()=>{phase='toss';tossStart=performance.now();$('game-message').textContent='';$('attack').disabled=false;$('attack').textContent='アタック！';},1000)}
function judge(elapsed){let err=Math.abs(elapsed-1700);return err<=100?100:err<=230?60:err<=380?25:err<=520?10:0}
document.addEventListener('pointerdown',e=>{if(screen!=='game'||e.target.closest('#sound,dialog')||e.isPrimary===false)return;e.preventDefault();if(phase!=='toss'||performance.now()<lockedUntil)return;hitElapsed=performance.now()-tossStart;if(bonusRound){doBonusHit();return}hitQuality=judge(hitElapsed);doHit(hitQuality)});
$('attack').addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&phase==='toss'){e.preventDefault();hitElapsed=performance.now()-tossStart;if(bonusRound){doBonusHit();return}hitQuality=judge(hitElapsed);doHit(hitQuality)}});
function doHit(points){if(phase!=='toss')return;phase='hit';hitQuality=points;const perfectDelay=points===100?650:0;hitStart=performance.now()+perfectDelay;if(perfectDelay){$('perfect-cutin').classList.remove('active');void $('perfect-cutin').offsetWidth;$('perfect-cutin').classList.add('active');tone(1200,.25,'triangle');}if(!bonusRound){scores.push(points);later(()=>{const beats=points===100?6:points===60?4:points>0?2:1;for(let i=0;i<beats;i++)later(()=>tone(points===0?440:700+i*90,.09,'triangle',.025),i*85)},550+perfectDelay);}$('attack').disabled=true;$('attack').textContent='ナイスチャレンジ！';const rating=points===100?'PERFECT!':points===60?'GREAT!':points===25?'NICE!':points===10?'GOOD!':'MISS…';$('hit-rating').innerHTML=rating+'<small>+'+points+' pt</small>';$('hit-rating').classList.add('show');$('score-label').textContent=scores.reduce((a,b)=>a+b,0);$('game-hint').textContent=points>=60?'いいタイミング！その調子！':points===0?'次はボールに合わせてタップしよう！':'リングに重なる瞬間を狙おう！';tone(points>=60?850:350,.16,'triangle');later(()=>{$('game-hint').textContent=points===100?'やったー！最高の一打！':points===60?'いい感じ！ナイスアタック！':points===25?'決まった！次はもっと高得点！':points===10?'当たった！次はタイミングを合わせよう！':'くやしい…！次こそ決めよう！'},1100+perfectDelay);later(()=>{if(bonusRound){bonusRound=false;showPrize();return}round++;if(round<3)nextRound();else finishGame()},2400+perfectDelay)}
function finishGame(){const total=scores.reduce((a,b)=>a+b,0);cleared=total>100;show('score');$('final-score').textContent=total;$('score-title').textContent=cleared?'NICE ATTACK!':'NICE CHALLENGE!';$('score-list').innerHTML=scores.map((v,i)=>'<div>ATTACK '+(i+1)+'<b>'+v+'<small> pt</small></b></div>').join('');['clear-banner','score-description','to-bonus'].forEach(id=>$(id).classList.toggle('hidden',cleared));$('clear-banner').textContent='記念写真を撮ろう！';$('score-description').innerHTML='ナイスチャレンジ！<br>選手フレームで記念撮影を楽しもう。';$('to-bonus').textContent='記念撮影へ →';if(cleared){fanfare();later(beginBonus,1000)}}
function beginBonus(){show('bonus');$('impact').classList.add('active');$('impact').innerHTML='<div class="bonus-burst"></div><b><span>BONUS</span><span>STAGE</span><span>OPEN!</span></b><small>特別な一打が、はじまる。</small>';$('bonus-hit').classList.add('hidden');fanfare();later(()=>{bonusRound=true;show('game');nextRound();$('game-message').textContent='BONUS ATTACK!';$('game-hint').textContent='ボールがリングに重なったら画面をタップ！\nここは採点なし・抽選はタイミングに関係なく10%'},2400)}
$('to-bonus').onclick=gate(()=>{if(cleared)beginBonus();else openPhoto()});
$('bonus-hit').onclick=gate(beginBonus);
function randomUnit(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}
function doBonusHit(){if(!bonusRound||phase!=='toss')return;winning=randomUnit()<.10;phase='hit';hitElapsed=1700;hitQuality=100;hitStart=performance.now()+650;rouletteStart=performance.now()/450;const sector=winning?0:1+Math.floor(randomUnit()*9),target=Math.PI/2-(sector+.5)*Math.PI/5;rouletteEnd=rouletteStart+Math.PI*4+((target-rouletteStart)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);$('perfect-cutin').classList.remove('active');void $('perfect-cutin').offsetWidth;$('perfect-cutin').classList.add('active');$('hit-rating').classList.remove('show');$('attack').disabled=true;$('attack').textContent='抽選スパイク！';$('game-hint').textContent='結果はランダム抽選。ボールの行方に注目！';later(()=>{$('hit-rating').innerHTML=winning?'HIT!':'NEXT CHANCE!';$('hit-rating').classList.add('show');$('game-hint').textContent=winning?'アタリのマスに命中！':'記念撮影も楽しんでね！';if(winning)fanfare()},1650);later(()=>{bonusRound=false;showPrize()},3300)}
function roulette(now){
 const t=phase==='hit'?Math.max(0,Math.min((now-hitStart)/950,1)):0,angle=phase==='hit'?rouletteStart+(rouletteEnd-rouletteStart)*(1-Math.pow(1-t,3)):now/450;
 // Freestanding upright wheel on the opponent court, face above the net.
 ellipse(210,210,62,9,'#08021d88');line(177,163,174,210,'#b5a2e2',9);line(243,163,246,210,'#b5a2e2',9);line(161,210,187,210,'#6f548f',7);line(233,210,259,210,'#6f548f',7);
 ctx.save();ctx.translate(210,101);ctx.shadowColor='#fbd85a';ctx.shadowBlur=18;ellipse(3,4,91,91,'#4f2a65');ellipse(0,0,89,89,'#f6c756');ctx.shadowBlur=0;
 for(let i=0;i<10;i++){let a=angle+i*Math.PI/5;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,81,a,a+Math.PI/5);ctx.closePath();ctx.fillStyle=i===0?'#ffd942':i%2?'#184786':'#3b78be';ctx.fill();ctx.strokeStyle='#fff9';ctx.lineWidth=1.5;ctx.stroke();ctx.save();ctx.rotate(a+Math.PI/10);ctx.translate(56,0);ctx.rotate(Math.PI/2);ctx.fillStyle=i===0?'#713300':'#d4edff';ctx.font=i===0?'900 13px sans-serif':'900 23px sans-serif';ctx.textAlign='center';ctx.fillText(i===0?'アタリ':'•',0,6);ctx.restore()}
 for(let i=0;i<24;i++){let a=i*Math.PI/12;ellipse(Math.cos(a)*86,Math.sin(a)*86,2.1,2.1,(Math.floor(now/160)+i)%2?'#fff9da':'#ef8a27')}
 ellipse(0,0,12,12,'#fff1a7');ellipse(0,0,5,5,'#cf7d25');
 // Fixed impact zone; selected sector rotates into this point independently of timing.
 if(phase==='hit'){ctx.beginPath();ctx.arc(0,58,12,0,Math.PI*2);ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();line(-17,58,-10,58,'#fff',2);line(10,58,17,58,'#fff',2);line(0,41,0,48,'#fff',2);line(0,68,0,75,'#fff',2);}
 ctx.restore();
}
function showPrize(){show('prize');$('prize').classList.toggle('lose',!winning);$('prize-icon').textContent=winning?'★':'✦';$('prize-title').textContent=winning?'大当たり！':'ナイスチャレンジ！';$('prize-copy').innerHTML=winning?'この画面をスタッフに見せて、<br>景品を受け取ろう！':'今回は残念…でも、お楽しみは続く！<br>記念写真を撮って帰ろう。';$('winner-ticket').classList.toggle('hidden',!winning);$('ticket-id').textContent='DEMO-'+String(Math.floor(randomUnit()*9000)+1000);$('prize-next').textContent=winning?'スタッフ確認 → 記念撮影へ':'記念撮影へ →';$('confetti').innerHTML=winning?Array.from({length:25},(_,i)=>'<i style="left:'+i*4+'%;background:'+['#ffcd31','#ff5a8d','#5bbcf9'][i%3]+';animation-delay:'+(-Math.random()*3)+'s;animation-duration:'+(2+Math.random()*2)+'s"></i>').join(''):'';if(winning)fanfare()}
$('prize-next').onclick=gate(()=>{if(winning&&!confirm('【デモ用スタッフ確認】\n当選画面の確認を終え、記念撮影へ進みますか？\n本サンプルには実景品の引換機能はありません。'))return;openPhoto()});
function openPhoto(){show('photo');$('camera-status').textContent='公式公開写真を使用した提案用サンプルです。';setFrame(frame)}
let photoPlayers=[];$('player-size').oninput=()=>document.querySelector('.photo-preview').style.setProperty('--player-size',$('player-size').value+'%');
fetch('assets/players.json').then(r=>r.json()).then(data=>{photoPlayers=Array.isArray(data)?data:data.players;buildFrames();setFrame(0)}).catch(()=>{$('camera-status').textContent='選手写真の読み込みに失敗しました。ページを再読み込みしてください。'});
function buildFrames(){$('frame-picker').innerHTML=photoPlayers.map((p,i)=>'<button type="button" data-frame="'+i+'" aria-label="'+p.name+'"><b>'+(p.number??'★')+'</b>'+p.name+'</button>').join('')}
$('frame-picker').onclick=e=>{const b=e.target.closest('button');if(b)setFrame(+b.dataset.frame)};
function setFrame(i){frame=i;let p=photoPlayers[i];if(!p)return;document.querySelector('.player-size-control').style.display=p.number?'flex':'none';document.querySelector('.photo-preview').classList.toggle('coach-frame',!!p.portrait);document.querySelector('.photo-preview').classList.toggle('mascot-frame',!p.number&&!p.portrait);$('photo-overlay').style.setProperty('--frame-color',frameColors[i%frameColors.length]);$('frame-name').textContent=(p.number?'#'+p.number+' ':'')+p.name;[...$('frame-picker').children].forEach((b,n)=>{b.classList.toggle('selected',n===i);b.setAttribute('aria-pressed',String(n===i))});const photo=new Image();photo.onload=()=>{if(frame!==i)return;const c=$('frame-player').getContext('2d');c.clearRect(0,0,800,1024);if(p.number&&!p.portrait){const sw=photo.width*.85,sh=Math.min(photo.height,sw*1.28);c.drawImage(photo,(photo.width-sw)/2,0,sw,sh,0,0,800,1024)}else{const scale=Math.min(800/photo.width,1024/photo.height);c.drawImage(photo,(800-photo.width*scale)/2,1024-photo.height*scale,photo.width*scale,photo.height*scale)}};photo.src=p.image;$('camera-status').textContent=p.portrait?'中田ヘッドコーチは全身素材未確認のため、公式プロフィール写真を仮配置しています。':'公式公開写真を使用した提案用サンプルです。';}
async function startCamera(){if(!navigator.mediaDevices?.getUserMedia){$('camera-status').textContent='このブラウザではカメラを利用できません。Safari / Chrome の最新版でお試しください。';return}const b=$('camera-start');b.disabled=true;b.textContent='カメラを準備中…';try{stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1080},height:{ideal:1440}}});$('camera').srcObject=stream;await $('camera').play();$('camera-placeholder').classList.add('hidden');b.classList.add('hidden');$('capture').classList.remove('hidden');$('camera-status').textContent='左のガイドに顔の大きさと目線を合わせてね。ガイドは保存写真には入りません。'}catch(err){$('camera-status').textContent=err.name==='NotAllowedError'?'カメラが許可されていません。ブラウザの権限設定をご確認ください。':'カメラを起動できませんでした。他のアプリが使用していないかご確認ください。'}finally{b.disabled=false;b.textContent='カメラを起動する'}}
$('camera-start').onclick=gate(startCamera);
$('capture').onclick=gate(async()=>{const v=$('camera');if(!stream||!v.videoWidth)return;const preview=document.querySelector('.photo-preview'),pr=preview.getBoundingClientRect(),out=document.createElement('canvas');out.width=900;out.height=Math.round(900*pr.height/pr.width);const c=out.getContext('2d'),k=900/pr.width,oh=out.height;const scale=Math.max(900/v.videoWidth,oh/v.videoHeight),dw=v.videoWidth*scale,dh=v.videoHeight*scale;c.save();c.translate(900,0);c.scale(-1,1);c.drawImage(v,(900-dw)/2,(oh-dh)/2,dw,dh);c.restore();c.save();c.beginPath();c.rect(0,0,900,oh);c.clip();const img=$('frame-player');if(athlete.complete&&athlete.naturalWidth){const ir=img.getBoundingClientRect(),fit=Math.min(ir.width/800,ir.height/1024),iw=800*fit,ih=1024*fit;c.drawImage(img,(ir.left-pr.left+(ir.width-iw)/2)*k,(ir.bottom-pr.top-ih)*k,iw*k,ih*k)}c.restore();c.strokeStyle=frameColors[frame%frameColors.length];c.lineWidth=14*k;c.strokeRect(0,0,900,oh);const topH=(document.querySelector('.frame-top').getBoundingClientRect().bottom-pr.top)*k,botH=(pr.bottom-document.querySelector('.frame-bottom').getBoundingClientRect().top)*k;c.fillStyle=frameColors[frame%frameColors.length];c.fillRect(0,0,900,topH);c.fillRect(0,oh-botH,900,botH);c.fillStyle='white';c.font='900 '+(14*k)+'px sans-serif';c.fillText('NICE ATTACK!   SPRINGS',18*k,25*k);c.font='900 '+(17*k)+'px sans-serif';c.fillText($('frame-name').textContent,18*k,oh-botH+27*k);c.font=(9*k)+'px sans-serif';c.fillText('SPRINGS CHALLENGE · SAMPLE',18*k,oh-16*k);if(capturedUrl)URL.revokeObjectURL(capturedUrl);const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));capturedUrl=URL.createObjectURL(blob);$('saved-photo').src=capturedUrl;$('download-photo').href=capturedUrl;show('photo-result');stopCamera();tone(1000,.15)});
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;$('camera').srcObject=null;$('camera-placeholder').classList.remove('hidden');$('camera-start').classList.remove('hidden');$('capture').classList.add('hidden')}
$('retake').onclick=gate(()=>{show('photo');startCamera()});$('finish').onclick=gate(end);$('end-photo').onclick=gate(end);function end(){stopCamera();show('end');if(capturedUrl){URL.revokeObjectURL(capturedUrl);capturedUrl=null;$('saved-photo').removeAttribute('src')}}$('back-home').onclick=gate(()=>{clearTimers();show('home');document.querySelector('.power-ball').getAnimations().forEach(a=>a.cancel());});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream)stopCamera()});window.addEventListener('pagehide',stopCamera);
// Illustration renderer. 2.5D indoor court and articulated athlete.
function path(points,fill,stroke,lw=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function line(x1,y1,x2,y2,color,width){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}
function player(x,y,s,pose,time){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const jumping=pose==='hit'?Math.sin(Math.min(time/750,1)*Math.PI)*35:0;ctx.translate(0,-jumping);ellipse(0,113,38,8,'#144c7330');const skin='#ffd0ad',skinShade='#eba984';// legs
line(-13,63,-17,94,'#173c76',15);line(12,63,20,93,'#173c76',15);line(-17,94,-18,112,skin,11);line(20,93,24,111,skin,11);line(-23,114,-10,114,'#fff',12);line(17,113,31,113,'#fff',12);line(-24,119,-8,119,'#80a6c7',3);line(17,118,33,118,'#80a6c7',3);
path([[-24,12],[23,12],[28,65],[-27,65]],'#096ccd','#073e8e',2);path([[-23,12],[-10,14],[-5,64],[-27,65]],'#238bec');path([[12,12],[23,12],[28,65],[20,65]],'#064dad');path([[-27,64],[28,64],[25,78],[-26,78]],'#153b72');line(-23,48,24,48,'#ff70a6',5);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 25px sans-serif';ctx.fillText('7',0,41);
// arms animate independently
const swing=pose==='hit'?Math.min(time/450,1):pose==='ready'?0:Math.sin(time/250)*.04;
let lx=-44,ly=32,rx=42,ry=21;
if(pose==='toss'){lx=-38;ly=-7;rx=38;ry=-13}if(pose==='hit'){lx=-38;ly=8;rx=22+38*swing;ry=-53+88*swing}
line(-22,18,lx,ly,skinShade,12);line(lx,ly,lx+4,ly-23,skin,10);ellipse(lx+4,ly-25,6,8,skin);line(22,18,rx,ry,skinShade,12);line(rx,ry,rx+5,ry-21,skin,10);ellipse(rx+5,ry-23,6,8,skin);
line(0,6,0,-4,skinShade,13);ellipse(0,-24,25,29,'#272239');ellipse(24,-30,8,15,'#29223b');ellipse(30,-20,8,22,'#29223b');ellipse(0,-23,22,25,skin);path([[-23,-28],[-19,-46],[0,-53],[19,-46],[23,-27],[13,-36],[1,-34],[-5,-43],[-12,-32]],'#302a42');ellipse(-8,-23,2.4,3.5,'#26324e');ellipse(8,-23,2.4,3.5,'#26324e');ellipse(-13,-14,5,2.7,'#f39e9b77');ellipse(13,-14,5,2.7,'#f39e9b77');ctx.beginPath();ctx.arc(0,-13,5,0,Math.PI);ctx.strokeStyle='#b65853';ctx.lineWidth=2;ctx.stroke();ctx.restore()}

const sponsorLogo=new Image();sponsorLogo.src='assets/hisamitsu-logo.jpeg';
const reactionAtlas=new Image();reactionAtlas.src='assets/reactions.png';
const motionAtlas=new Image();motionAtlas.src='assets/action-atlas.png';
function volleyball(x,y,r,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);const g=ctx.createRadialGradient(-r*.4,-r*.5,0,0,0,r);g.addColorStop(0,'#fff16a');g.addColorStop(.55,'#ffd21b');g.addColorStop(1,'#d49503');ellipse(0,0,r,r,g);ctx.save();ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI*2/3);ctx.beginPath();ctx.moveTo(-r*.05,-r);ctx.bezierCurveTo(r*.6,-r*.7,r*.9,-r*.1,r*.85,r*.55);ctx.lineTo(r*.5,r*.9);ctx.bezierCurveTo(r*.7,r*.1,r*.25,-r*.4,-r*.4,-r*.8);ctx.closePath();ctx.fillStyle='#113c93';ctx.fill();ctx.strokeStyle='#6693d4';ctx.lineWidth=.6;ctx.stroke();ctx.restore()}ctx.restore();ellipse(-r*.35,-r*.4,r*.24,r*.13,'#ffffff45');ctx.restore()}
function smooth(t){return t*t*(3-2*t)}
function tossPosition(ms){let t=ms/1700;return {x:276-93*t,y:157-67*t-100*Math.sin(Math.min(t,1.6)*Math.PI)}}
const poseRects=[[0,190,319,741],[320,130,290,800],[610,60,310,710],[920,220,350,710],[1240,85,295,845]];
function drawAthlete(cell,x,foot,size=150,angle=0){if(!motionAtlas.complete||!motionAtlas.naturalWidth)return;ctx.save();ctx.translate(x,foot);ctx.rotate(angle);const [sx,sy,sw,sh]=poseRects[Math.max(0,Math.min(4,cell))],scale=size/320;ctx.translate(-sw*scale/2,-sh*scale);ctx.scale(scale,scale);if(cell===4){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(sw,0);ctx.lineTo(sw,sh);ctx.lineTo(0,sh);ctx.lineTo(0,410);ctx.lineTo(45,410);ctx.lineTo(45,220);ctx.lineTo(0,220);ctx.closePath();ctx.clip()}if(cell===3){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(sw-35,0);ctx.lineTo(sw-35,110);ctx.lineTo(sw,110);ctx.lineTo(sw,sh);ctx.lineTo(0,sh);ctx.closePath();ctx.clip()}ctx.drawImage(motionAtlas,sx,sy,sw,sh,0,0,sw,sh);ctx.restore()}


function drawReaction(points,x,foot,ms,flip){
 const cell=points===100?0:points===60?1:points===25?2:points===10?3:4;const [sx,sy,sw,sh]=[[119,6,311,776],[519,19,250,764],[889,19,234,764],[1244,21,284,761],[1626,18,211,764]][cell],dw=245*sw/sh;
 const progress=Math.min(Math.max((ms-110)/260,0),1),cx=x+(195-x)*progress,base=foot+(425-foot)*progress;
 const hop=points>=60?Math.abs(Math.sin((ms-110)/150))* (points===100?15:9):points>0?Math.sin(ms/180)*3:0;
 const tilt=points===0?Math.sin(ms/130)*.035:points===10?Math.sin(ms/210)*.025:points>=60?Math.sin(ms/180)*.025:0;
 ctx.save();ctx.translate(cx,base-hop);ctx.rotate(tilt);ctx.scale(flip,1);ctx.drawImage(reactionAtlas,sx,sy,sw,sh,-dw/2,-245,dw,245);ctx.restore();
 if(points>=60){for(let j=0;j<5;j++){let a=j*1.25+ms/1200;ctx.fillStyle=['#ffe055','#ff89bc','#7fefff'][j%3];ctx.font='bold 15px sans-serif';ctx.fillText('✦',cx+Math.cos(a)*90,base-150+Math.sin(a)*75)}}else if(points===0){ctx.fillStyle='#b8e8ff';ctx.font='bold 22px sans-serif';ctx.fillText('…',cx+65,base-190);}
}

// Crowd feedback stays behind the court and works with audio muted.
function drawCrowd(now){
 const ms=now-hitStart,active=screen==='game'&&!bonusRound&&phase==='hit'&&ms>500&&ms<2400;
 const level=hitQuality===100?4:hitQuality===60?3:hitQuality===25?2:hitQuality===10?1:0;
 const strength=active?[.25,.35,.5,.8,1][level]:0,fade=active?Math.min((ms-500)/200,1,Math.max(0,(2400-ms)/300)):0;
 for(let row=0;row<4;row++)for(let i=0;i<30;i++){
  let x=i*14+(row%2)*6,base=60+row*15,wave=Math.max(0,Math.sin(now/(level>=3?85:150)+i*.52+row)),y=base-wave*strength*9;
  const col=['#759fc0','#d7bad4','#89c6e0','#48658e'][i%4];ellipse(x,y,3,4,col);
  if(active&&((i+row)%(level>=3?1:level===2?2:4)===0)){
   const reach=level===0?4:level>=3?9:4,dx=level>=3?5:2+wave*3;
   line(x-2,y+4,x-dx,y-reach*wave,col,1.7);line(x+2,y+4,x+dx,y-reach*wave,col,1.7);
  }
 }
 if(!active)return;
 ctx.save();ctx.globalAlpha=fade;
 const labels=['もう一本！','パチパチ！','いいぞ！','ワァーッ！','大歓声！'];
 ctx.font='900 '+(level===4?18:level===3?15:12)+'px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#10284b';ctx.fillStyle=level>=3?'#ffe47b':'#d8f7ff';
 for(const x of (level>=3?[65,325]:[70,320])){let yy=39-Math.sin(now/180+x)*2;ctx.strokeText(labels[level],x,yy);ctx.fillText(labels[level],x,yy)}
 if(level===4){for(let i=0;i<36;i++){let x=(i*47+Math.sin(now/260+i)*10)%390,y=20+((ms-500)*.085+i*13)%130;ctx.save();ctx.translate(x,y);ctx.rotate(now/180+i);ctx.fillStyle=['#ffe258','#ff77bb','#7af0ff','#ffffff'][i%4];ctx.fillRect(-2,-3,4,6);ctx.restore()}}
 ctx.restore();
}
function render(now){ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,W,H);
const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,bonusRound?'#100823':'#071736');bg.addColorStop(.4,bonusRound?'#291344':'#176d9c');bg.addColorStop(1,bonusRound?'#170c33':'#39b7c1');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
for(let i=0;i<7;i++){const x=i*67-10;line(x,12,x+45,110,'#bfeeff0c',25);ellipse(x,14,16,3,'#d7f5ff')}
drawCrowd(now);
ctx.fillStyle='#124e83';ctx.fillRect(0,118,390,32);ctx.fillStyle='#c4edff';ctx.textAlign='center';ctx.font='900 12px sans-serif';ctx.fillText('SAGA  ·  SPRINGS',195,139);
path([[82,157],[308,157],[450,450],[-60,450]],'#f3be87','#ffeecf',3);path([[82,157],[308,157],[336,215],[54,215]],'#e1a573');path([[54,215],[336,215],[450,450],[-60,450]],'#efbd8b');for(let i=0;i<16;i++)line(65+i*17,157,-40+i*30,450,'#a96e3b12',1);line(195,157,195,450,'#fff7',2);line(25,275,367,275,'#fff',3);line(-25,376,418,376,'#fff',3);
// Bonus keeps the same playable court, dressed as a night party arena.
if(bonusRound){ctx.fillStyle='#16092d99';ctx.fillRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<5;i++){let x=30+i*83,end=195+Math.sin(now/1100+i*1.8)*220;const g=ctx.createLinearGradient(x,0,end,450);g.addColorStop(0,['#fff4baaa','#ec64ff99','#56dfff99'][i%3]);g.addColorStop(1,'#5a1c7000');path([[x-4,5],[x+4,5],[end+85,450],[end-85,450]],g);ellipse(x,9,9,4,'#fff4be');}ctx.restore();for(let i=0;i<24;i++){let x=(i*83)%390,y=(i*39+now/35)%140;ellipse(x,y,1.2,1.2,['#ffe786','#e78cff','#7be5ff'][i%3]);}ctx.fillStyle='#ffe691';ctx.font='900 12px sans-serif';ctx.fillText('★ SPECIAL NIGHT ★',195,139);line(25,275,367,275,'#e8afff',2);line(-25,376,418,376,'#e8afff',2);}
// User-supplied brand asset, preserved in its original proportions.
if(sponsorLogo.complete&&sponsorLogo.naturalWidth){for(const x of [8,140,272]){ctx.fillStyle='white';ctx.fillRect(x,119,110,32);ctx.drawImage(sponsorLogo,x+4,119,102,30.7);}for(const x of [0,341]){ctx.fillStyle='#ffffff';ctx.fillRect(x,286,49,16);ctx.drawImage(sponsorLogo,x+1,287,47,14.1);}}
if(bonusRound)roulette(now);
// Far side defenders face the incoming ball.
for(const x of (bonusRound?[]:[135,255])){ellipse(x,188,13,4,'#653b4d22');if(athlete.complete&&athlete.naturalWidth)ctx.drawImage(athlete,0,0,800,1024,x-20,131,40,56)}
// Net divides the opponent court from the near-side players.
line(34,186,355,186,'#fff',4);for(let y=193;y<235;y+=8)line(34,y,355,y,'#f0ffff70',.65);for(let x=34;x<356;x+=12)line(x,187,x,236,'#f0ffff70',.65);line(34,236,355,236,'#fff',2);line(32,179,32,263,'#083d75',7);line(357,179,357,263,'#083d75',7);line(32,175,32,190,'#fff',3);line(357,175,357,190,'#fff',3);
let elapsed=phase==='toss'?Math.max(0,now-tossStart):Math.max(0,hitElapsed);if(bonusRound&&phase==='toss'&&elapsed>2350){tossStart=now;elapsed=0;}
let approach=phase==='ready'?0:Math.min(elapsed/1450,1),jump=phase==='ready'?0:Math.max(0,Math.sin(Math.min(Math.max((elapsed-1050)/1000,0),1)*Math.PI))*70;
let ax=105+78*smooth(approach),foot=420-65*smooth(approach)-jump,cell=phase==='ready'?0:elapsed<1100?0:elapsed<1400?1:2;
let hitMs=Math.max(0,now-hitStart);
if(phase==='hit'){cell=hitQuality===0?(hitElapsed<1100?0:1):hitMs<120?2:3;const grounded=420-65*smooth(approach);foot=foot+(grounded-foot)*Math.min(hitMs/650,1)}else if(phase==='toss'&&elapsed<1100){foot-=Math.abs(Math.sin(elapsed/95))*4}
ellipse(ax,363,27,7,'#63452c25');ellipse(276,325,20,5,'#63452c20');drawAthlete(4,276,326-(phase==='toss'?Math.max(0,1-elapsed/350)*7:0),65);if(phase==='hit'&&hitMs>=1100&&reactionAtlas.complete&&reactionAtlas.naturalWidth){const rt=hitMs-1100,flip=Math.min(rt/220,1);if(flip<.5){ctx.save();ctx.translate(ax,foot);ctx.scale(Math.max(.03,1-flip*2),1);drawAthlete(cell,0,0,90);ctx.restore()}else{drawReaction(bonusRound?(winning?100:10):hitQuality,ax,foot,rt,Math.min((flip-.5)*2,1));}}else drawAthlete(cell,ax,foot,90);
if(phase==='ready')volleyball(276,157,12,0);
if(phase==='toss'){
const pos=tossPosition(elapsed),tx=183,ty=90;let close=Math.abs(elapsed-1700)<150;
{ctx.beginPath();ctx.arc(tx,ty,23+Math.sin(now/110)*2,0,Math.PI*2);ctx.strokeStyle=close?'#ffe44a':'#65ffed';ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(tx,ty,30,0,Math.PI*2);ctx.strokeStyle='#b7fff757';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='white';ctx.font='bold 10px sans-serif';ctx.fillText('TAP!',tx,ty-37);}
for(let i=3;i>0;i--){let q=tossPosition(Math.max(0,elapsed-i*35));ellipse(q.x,q.y,8-i,8-i,'#ffffff22')};volleyball(pos.x,pos.y,12,now/500);
if(!bonusRound&&elapsed>2350){hitElapsed=elapsed;hitQuality=0;doHit(0)}
}
if(phase==='hit'&&now<hitStart)volleyball(183,90,12,0);
if(phase==='hit'&&now>=hitStart){
const origin=tossPosition(hitElapsed);let p;
if(hitQuality===0){let t=Math.min(hitMs/950,1);p={x:origin.x+20*t,y:origin.y+(380-origin.y)*t*t};volleyball(p.x,p.y,12,now/500);if(t===1&&hitMs<1400){let b=(hitMs-950)/450;volleyball(p.x+10*b,380-28*Math.sin(b*Math.PI),12,now/500)}}
else {const duration=bonusRound?950:hitQuality===100?330:hitQuality===60?500:850,t=Math.min(Math.max(hitMs-100,0)/duration,1),ex=bonusRound?210:hitQuality<=25?240:120,ey=bonusRound?159:hitQuality<=25?208:173; p={x:183+(ex-183)*t,y:90+(ey-90)*t-(hitQuality<=25?40*Math.sin(t*Math.PI):0)};
if(t<1){if(hitQuality===100){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(ey-90,ex-183));ctx.globalCompositeOperation='screen';for(let j=0;j<6;j++){let wave=Math.sin(now/45+j)*4;path([[9,0],[-18-j*5,-12+j],[-65-j*3,wave],[-24-j*5,12-j]],['#ff4b1266','#ff941c88','#ffd35caa'][j%3]);}ctx.shadowColor='#ff8c14';ctx.shadowBlur=18;ellipse(0,0,17,17,'#ffbb4444');ctx.restore();}if(hitQuality>=60){line(p.x+(183-ex)*.35,p.y-14,p.x,p.y,hitQuality===100?'#ffec57aa':'#ffffff77',hitQuality===100?10:5)}volleyball(p.x,p.y,12-5*t,now/(hitQuality===100?65:110))}else if(hitMs<duration+650){let burst=(hitMs-duration-100)/450;ctx.save();ctx.translate(ex,ey);if(hitQuality===100){ctx.globalAlpha=Math.max(0,1-burst);ctx.strokeStyle='#ff9f24';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,12+burst*75,7+burst*30,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff4c2';ctx.font='900 20px sans-serif';ctx.fillText('BOOM!',0,-25-burst*20);}for(let i=0;i<10;i++){let a=i*Math.PI/5,r=8+Math.max(0,burst)*25;line(Math.cos(a)*r*.5,Math.sin(a)*r*.3,Math.cos(a)*r,Math.sin(a)*r*.6,hitQuality===100?'#fff379':'#fff9',2)}ctx.restore()}}
}
requestAnimationFrame(render)}
requestAnimationFrame(render);

function previewMode(id){clearTimers();$('spec-modal').close();phase='ready';bonusRound=false;if(id==='bonus'){cleared=true;beginBonus()}else if(id==='photo'){openPhoto()}else{winning=id==='win';showPrize()}}
['bonus','win','lose','photo'].forEach(id=>$('preview-'+id).onclick=()=>previewMode(id));
