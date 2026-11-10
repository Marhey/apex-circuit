export const LAP_LENGTH=2000,LAPS=3,MAX_SPEED=280,TIME_LIMIT=180;
export type Race={phase:'ready'|'countdown'|'racing'|'over';distance:number;speed:number;x:number;steer:number;elapsed:number;countdown:number;laps:number;lapStart:number;lapTimes:number[];penalties:number;impact:number;finished:boolean;score:number;notice:string};
export type Controls={steer:number;throttle:boolean;brake:boolean};
export function freshRace():Race{return {phase:'ready',distance:0,speed:0,x:0,steer:0,elapsed:0,countdown:3,laps:0,lapStart:0,lapTimes:[],penalties:0,impact:0,finished:false,score:0,notice:'Three laps. One clean line.'}}
export function curveAt(position:number){
  const p=((position%LAP_LENGTH)+LAP_LENGTH)%LAP_LENGTH;
  const sections:[[number,number],...Array<[number,number]>]=[[220,0],[580,.62],[760,0],[1070,-.84],[1230,0],[1570,.78],[1740,0],[1940,-.72],[2000,0]];
  let from=0;for(const [to,curve] of sections){if(p<to){const t=(p-from)/(to-from);return curve*Math.min(1,t*6,(1-t)*6)}from=to}return 0;
}
export function paceCars(race:Race){return [{start:95,speed:165,lane:-.48,color:'#d87b42'},{start:260,speed:185,lane:.5,color:'#98b4c6'},{start:440,speed:175,lane:-.1,color:'#c9cf7b'}].map(car=>({...car,delta:((car.start+race.elapsed*car.speed/3.6-race.distance)%LAP_LENGTH+LAP_LENGTH)%LAP_LENGTH}))}
export function startRace(race:Race){Object.assign(race,freshRace());race.phase='countdown';race.notice='Get ready. Three laps of Apex Circuit.'}
export function raceScore(elapsed:number,penalties:number){return Math.max(100,Math.round(20000-elapsed*80-penalties*200))}
export function advanceRace(race:Race,seconds:number,input:Controls){
  if(!Number.isFinite(seconds))return;
  const dt=Math.max(0,Math.min(.05,seconds));
  if(race.phase==='countdown'){race.countdown-=dt;if(race.countdown<=0){race.phase='racing';race.notice='Green light! Find your racing line.'}return}
  if(race.phase!=='racing')return;
  race.elapsed+=dt;race.impact=Math.max(0,race.impact-dt);
  const steer=Math.max(-1,Math.min(1,input.steer));race.steer+=(steer-race.steer)*Math.min(1,dt*8);
  const ratio=race.speed/MAX_SPEED;
  race.speed=Math.max(0,Math.min(MAX_SPEED,race.speed+(input.brake?-145:input.throttle?52: -24)*dt));
  race.x+=race.steer*(.35+ratio*1.45)*dt-curveAt(race.distance)*ratio*ratio*.95*dt;
  if(Math.abs(race.x)>1.02){race.speed=Math.max(0,race.speed-75*dt);if(race.speed>100)race.speed=Math.max(100,race.speed-120*dt)}
  if(Math.abs(race.x)>1.65){race.x=Math.sign(race.x)*1.45;if(race.impact===0){race.speed*=.65;race.penalties++;race.impact=1.5;race.notice='Barrier contact. Brake earlier and bring it back to the tarmac.'}}
  for(const car of paceCars(race)){const delta=car.delta>LAP_LENGTH/2?car.delta-LAP_LENGTH:car.delta;if(Math.abs(delta)<5&&Math.abs(race.x-car.lane)<.24&&race.impact===0){race.speed*=.7;race.penalties++;race.impact=1.5;race.notice='Pace-car contact. Give yourself a little more space.'}}
  race.distance+=race.speed/3.6*dt;
  const laps=Math.min(LAPS,Math.floor(race.distance/LAP_LENGTH));
  if(laps>race.laps){race.lapTimes.push(race.elapsed-race.lapStart);race.lapStart=race.elapsed;race.laps=laps;race.notice=laps<LAPS?`Lap ${laps+1} of ${LAPS}. Keep it clean.`:'Chequered flag! Race complete.'}
  if(race.laps===LAPS||race.elapsed>=TIME_LIMIT){race.phase='over';race.finished=race.laps===LAPS;race.score=race.finished?raceScore(race.elapsed,race.penalties):0;if(!race.finished)race.notice='Time is up. Find a smoother line and try again.'}
}
export function formatTime(seconds:number){if(!Number.isFinite(seconds)||seconds<=0)return '—';const tenths=Math.round(seconds*10),mins=Math.floor(tenths/600),secs=((tenths%600)/10).toFixed(1).padStart(4,'0');return `${mins}:${secs}`}
