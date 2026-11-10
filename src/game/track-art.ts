import {curveAt,LAP_LENGTH,paceCars,type Race} from './engine';
const W=1000,H=600,HORIZON=190,FOCAL=470;
type Point={x:number;y:number;w:number;scale:number;z:number;offset:number};
function polygon(c:CanvasRenderingContext2D,color:string,points:number[][]){c.fillStyle=color;c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(points[i][0],points[i][1]):c.moveTo(points[i][0],points[i][1]);c.closePath();c.fill()}
function project(z:number,offset:number,player:number):Point{const scale=FOCAL/(z+6);return {x:W/2+(offset-player*5.7)*scale,y:HORIZON+3.4*scale,w:7*scale,scale,z,offset}}
export function drawTrack(c:CanvasRenderingContext2D,race:Race,clock:number,reduced:boolean){
  c.clearRect(0,0,W,H);
  const sky=c.createLinearGradient(0,0,0,260);sky.addColorStop(0,'#83b7cb');sky.addColorStop(1,'#e7d8b2');c.fillStyle=sky;c.fillRect(0,0,W,H);
  c.fillStyle='#f8eac4';c.beginPath();c.arc(793,94,31,0,Math.PI*2);c.fill();
  const horizonShift=curveAt(race.distance)*-38;
  polygon(c,'#96a8a0',[[0,175],[90+horizonShift,95],[180,150],[305+horizonShift,81],[430,158],[615+horizonShift,111],[790,160],[920,107],[1000,163],[1000,270],[0,270]]);
  polygon(c,'#698879',[[0,189],[150,139],[270,190],[460,141],[610,180],[810,147],[1000,187],[1000,270],[0,270]]);
  c.fillStyle='#7b925d';c.fillRect(0,HORIZON,W,H-HORIZON);
  const points:Point[]=[];let offset=0,heading=0,previous=0;
  for(let i=0;i<=90;i++){
    const z=2+Math.pow(i/90,1.85)*650,step=z-previous;heading+=curveAt(race.distance+z)*step*.0027;offset+=heading*step;points.push(project(z,offset,race.x));previous=z;
  }
  // Project from the far distance toward the cockpit, preserving the curve ahead.
  for(let i=points.length-1;i>0;i--){const far=points[i],near=points[i-1],stripe=Math.floor((race.distance+near.z)/9)%2===0;
    polygon(c,stripe?'#78925c':'#728b56',[[0,far.y],[W,far.y],[W,near.y],[0,near.y]]);
    polygon(c,stripe?'#f1ead5':'#bd5945',[[far.x-far.w*1.16,far.y],[far.x+far.w*1.16,far.y],[near.x+near.w*1.16,near.y],[near.x-near.w*1.16,near.y]]);
    polygon(c,stripe?'#41494b':'#454d4f',[[far.x-far.w,far.y],[far.x+far.w,far.y],[near.x+near.w,near.y],[near.x-near.w,near.y]]);
    for(const side of [-1,1])polygon(c,'#eae6cf',[[far.x+side*far.w*.92-far.scale*.055,far.y],[far.x+side*far.w*.92+far.scale*.055,far.y],[near.x+side*near.w*.92+near.scale*.055,near.y],[near.x+side*near.w*.92-near.scale*.055,near.y]]);
    if(Math.floor((race.distance+near.z)/12)%3===0)for(const lane of [-.33,.33])polygon(c,'#d9dccb',[[far.x+far.w*lane-far.scale*.045,far.y],[far.x+far.w*lane+far.scale*.045,far.y],[near.x+near.w*lane+near.scale*.045,near.y],[near.x+near.w*lane-near.scale*.045,near.y]]);
    // Fixed start/finish paint repeats at the same position on every lap.
    if((race.distance+near.z)%LAP_LENGTH<9){for(let square=0;square<12;square++)polygon(c,square%2?'#263237':'#f5efd9',[[far.x-far.w+2*far.w*square/12,far.y],[far.x-far.w+2*far.w*(square+1)/12,far.y],[near.x-near.w+2*near.w*(square+1)/12,near.y],[near.x-near.w+2*near.w*square/12,near.y]])}
  }
  // Trackside boards, grandstands and kerb markers are fixed to the circuit.
  for(let i=points.length-1;i>5;i--){const p=points[i],world=race.distance+p.z;
    if(Math.floor(world/24)!==Math.floor((race.distance+points[i-1].z)/24)){
      for(const side of [-1,1]){c.fillStyle='#c8d5ce';c.fillRect(p.x+side*p.w*1.25,p.y-1.7*p.scale,Math.max(1,.12*p.scale),1.7*p.scale);c.fillStyle='#3a5150';c.fillRect(p.x+side*p.w*1.25,p.y-1.7*p.scale,Math.max(1,.18*p.scale),.5*p.scale)}
    }
    if(p.z>50&&p.z<500&&Math.floor(world/180)!==Math.floor((race.distance+points[i-1].z)/180)){
      const side=Math.floor(world/180)%2?1:-1,x=p.x+side*p.w*2.0,width=10*p.scale,height=4*p.scale;
      polygon(c,'#bec5b6',[[x-width/2,p.y],[x+width/2,p.y],[x+width/2,p.y-height*.6],[x-width*.2,p.y-height],[x-width/2,p.y-height]]);
      c.fillStyle='#445c57';c.fillRect(x-width/2,p.y-height,width,height*.14);c.fillStyle='#e3b858';for(let j=0;j<5;j++)c.fillRect(x-width*.35+j*width*.14,p.y-height*.5,width*.06,height*.12);
    }
  }
  // Pace cars move independently, so they can be overtaken.
  const cars=paceCars(race).filter(car=>car.delta>3&&car.delta<600).sort((a,b)=>b.delta-a.delta);
  for(const car of cars){const z=car.delta,p=points.reduce((best,a)=>Math.abs(a.z-z)<Math.abs(best.z-z)?a:best,points[0]);const width=1.65*p.scale,height=1.05*p.scale,x=p.x+car.lane*p.w,y=p.y;
    c.fillStyle='#233234';c.fillRect(x-width*.58,y-height*.4,width*.18,height*.5);c.fillRect(x+width*.4,y-height*.4,width*.18,height*.5);
    polygon(c,car.color,[[x-width*.5,y],[x+width*.5,y],[x+width*.48,y-height*.7],[x+width*.3,y-height],[x-width*.3,y-height],[x-width*.48,y-height*.7]]);c.fillStyle='#233f4b';c.fillRect(x-width*.26,y-height*.9,width*.52,height*.32);c.fillStyle='#f4c5a0';c.fillRect(x-width*.42,y-height*.25,width*.15,height*.1);c.fillRect(x+width*.27,y-height*.25,width*.15,height*.1);
  }
  // First-person cockpit: windshield pillars, bonnet, instrument panel and wheel.
  const shake=!reduced&&race.impact>0?Math.sin(clock*70)*3:0;c.save();c.translate(shake,0);
  polygon(c,'#193c3d',[[0,425],[220,451],[380,459],[620,459],[780,451],[1000,425],[1000,600],[0,600]]);
  polygon(c,'#356667',[[0,427],[220,449],[380,456],[620,456],[780,449],[1000,427],[1000,447],[770,469],[620,480],[380,480],[230,469],[0,447]]);
  polygon(c,'#14262c',[[0,0],[28,0],[118,460],[82,480]]);polygon(c,'#14262c',[[972,0],[1000,0],[918,480],[882,460]]);
  c.fillStyle='#0d2027';c.fillRect(0,492,W,108);c.fillStyle='#29424a';c.fillRect(350,466,300,61);c.fillStyle='#102830';c.fillRect(362,475,276,45);
  c.fillStyle='#cddd9c';c.font='bold 27px monospace';c.textAlign='center';c.fillText(String(Math.round(race.speed)).padStart(3,'0'),500,503);c.font='10px monospace';c.fillText('KM/H',575,499);
  const gears=race.speed<25?1:Math.min(6,Math.floor(race.speed/48)+1);c.fillStyle='#e4be6c';c.font='bold 21px monospace';c.fillText(String(gears),390,503);
  for(let i=0;i<12;i++){c.fillStyle=i<race.speed/24?(i>9?'#dd7b59':'#c8d995'):'#3a4e48';c.fillRect(374+i*20,464,14,5)}
  c.save();c.translate(500,600);c.rotate(race.steer*.7);c.strokeStyle='#071319';c.lineWidth=22;c.beginPath();c.arc(0,0,83,0,Math.PI*2);c.stroke();c.strokeStyle='#80908b';c.lineWidth=7;c.beginPath();c.moveTo(-74,-15);c.lineTo(0,15);c.lineTo(74,-15);c.moveTo(0,15);c.lineTo(0,77);c.stroke();c.fillStyle='#263b40';c.beginPath();c.arc(0,12,25,0,Math.PI*2);c.fill();c.fillStyle='#dcd18e';c.fillRect(-5,-83,10,15);c.restore();
  c.fillStyle='#a5b4ad';c.font='10px monospace';c.textAlign='left';c.fillText('APEX / CLUBSPORT',28,537);c.textAlign='right';c.fillText(Math.abs(race.x)>1.02?'OFF TRACK':'TRACK LIMITS OK',970,537);c.restore();
  // A small circuit map and progress marker help make the lap structure legible.
  c.save();c.translate(904,70);c.strokeStyle='#eef0d1b0';c.lineWidth=3;c.beginPath();c.moveTo(-36,-26);c.lineTo(18,-26);c.quadraticCurveTo(43,-25,34,4);c.lineTo(16,28);c.lineTo(-22,25);c.quadraticCurveTo(-49,22,-36,-26);c.stroke();const t=race.distance%LAP_LENGTH/LAP_LENGTH*Math.PI*2;c.fillStyle='#e4bc68';c.beginPath();c.arc(Math.sin(t)*34,-Math.cos(t)*25,5,0,Math.PI*2);c.fill();c.restore();
}
