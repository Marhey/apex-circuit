'use client';
import {useEffect,useRef,useState} from 'react';
import {advanceRace,freshRace,startRace,formatTime,TIME_LIMIT} from './engine';
import {drawTrack} from './track-art';
import Leaderboard,{useRankedRun} from '../leaderboard/leaderboard';
const RECORD_KEY='apex-circuit-record-v1';
type DriveKey='left'|'right'|'gas'|'brake';
export default function RaceGame(){
  const canvas=useRef<HTMLCanvasElement>(null),race=useRef(freshRace()),keys=useRef(new Set<string>()),buttons=useRef(new Set<DriveKey>()),drag=useRef<number|null>(null),pausedRef=useRef(false),autoRef=useRef(true),record=useRef({score:0,lap:0});
  const audio=useRef<{context:AudioContext;oscillator:OscillatorNode;gain:GainNode}|null>(null),soundRef=useRef(false);
  const [view,setView]=useState(()=>({...race.current})),[paused,setPaused]=useState(false),[automatic,setAutomatic]=useState(true),[sound,setSound]=useState(false),[personal,setPersonal]=useState({score:0,lap:0});
  const ranking=useRankedRun('apex-circuit');
  function pause(value:boolean){pausedRef.current=value;setPaused(value);keys.current.clear();buttons.current.clear();drag.current=null;if(!value)canvas.current?.focus({preventScroll:true})}
  function begin(){ranking.begin();startRace(race.current);pause(false);setView({...race.current});canvas.current?.focus({preventScroll:true})}
  function toggleSound(){soundRef.current=!soundRef.current;setSound(soundRef.current);if(soundRef.current&&!audio.current){try{const context=new AudioContext(),oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='triangle';gain.gain.value=0;oscillator.connect(gain);gain.connect(context.destination);oscillator.start();audio.current={context,oscillator,gain}}catch{soundRef.current=false;setSound(false)}}if(soundRef.current)void audio.current?.context.resume().catch(()=>{});if(race.current.phase==='racing'||race.current.phase==='countdown')canvas.current?.focus({preventScroll:true})}
  useEffect(()=>{
    try{const saved=JSON.parse(localStorage.getItem(RECORD_KEY)||'{}') as {score?:number;lap?:number};if(Number.isFinite(saved.score)&&Number.isFinite(saved.lap)&&(saved.score||0)>=0&&(saved.lap||0)>=0){record.current={score:saved.score||0,lap:saved.lap||0};setPersonal({...record.current})}}catch{}
    const context=canvas.current?.getContext('2d');if(!context)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0,last=0,sync=0,clock=0;
    const animate=(now:number)=>{
      const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
      if(!pausedRef.current){clock+=dt;const held=keys.current,touch=buttons.current;
        const steer=(held.has('arrowright')||held.has('d')||touch.has('right')?1:0)-(held.has('arrowleft')||held.has('a')||touch.has('left')?1:0)+(drag.current||0);
        const brake=held.has('arrowdown')||held.has('s')||held.has(' ')||touch.has('brake');
        advanceRace(race.current,dt,{steer,throttle:autoRef.current||held.has('arrowup')||held.has('w')||touch.has('gas'),brake});
      }
      drawTrack(context,race.current,clock,reduced);
      if(audio.current){audio.current.oscillator.frequency.value=48+race.current.speed*.65;audio.current.gain.gain.value=soundRef.current&&!pausedRef.current&&race.current.phase==='racing'?.025:0}
      if(now-sync>100){sync=now;setView({...race.current,lapTimes:[...race.current.lapTimes]});
        const fastest=race.current.lapTimes.length?Math.min(...race.current.lapTimes):0;
        if(race.current.score>record.current.score||fastest>0&&(!record.current.lap||fastest<record.current.lap)){
          record.current={score:Math.max(record.current.score,race.current.score),lap:fastest>0&&(!record.current.lap||fastest<record.current.lap)?fastest:record.current.lap};setPersonal({...record.current});try{localStorage.setItem(RECORD_KEY,JSON.stringify(record.current))}catch{}
        }
      }
      frame=requestAnimationFrame(animate);
    };frame=requestAnimationFrame(animate);
    const hidden=()=>{if(document.hidden&&(race.current.phase==='racing'||race.current.phase==='countdown'))pause(true)};
    const blur=()=>{keys.current.clear();buttons.current.clear();drag.current=null;if(race.current.phase==='racing'||race.current.phase==='countdown')pause(true)};
    document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',blur);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',blur);void audio.current?.context.close().catch(()=>{})};
  },[]);
  const live=view.phase==='racing'||view.phase==='countdown';
  function controlButton(key:DriveKey,label:string,description:string){return <button type="button" className={'race-drive race-drive-'+key} aria-label={description} disabled={!live||paused} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);buttons.current.add(key)}} onPointerUp={()=>buttons.current.delete(key)} onPointerCancel={()=>buttons.current.delete(key)} onLostPointerCapture={()=>buttons.current.delete(key)} onKeyDown={event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();buttons.current.add(key)}}} onKeyUp={()=>buttons.current.delete(key)} onBlur={()=>buttons.current.delete(key)} onContextMenu={event=>event.preventDefault()}>{label}<small>{key==='gas'?'THROTTLE':key==='brake'?'BRAKE':'STEER'}</small></button>}
  return <><section className="race-cabinet" aria-label="Apex Circuit racing game">
    <div className="race-hud"><div><span>LAP</span><strong>{Math.min(3,view.laps+1)}<small> / 3</small></strong></div><div className="race-speed-hud"><span>SPEED / KM/H</span><strong>{Math.round(view.speed)}</strong></div><div><span>RACE TIME</span><strong>{view.elapsed?formatTime(view.elapsed):'0:00.0'}</strong></div><div><span>BEST LAP</span><strong>{formatTime(personal.lap)}</strong></div><div><span>PERSONAL BEST</span><strong>{personal.score.toLocaleString()}</strong></div><button className="race-small" onClick={()=>pause(!pausedRef.current)} disabled={!live}>{paused?'Resume':'Pause'}</button></div>
    <div className="race-windshield"><canvas ref={canvas} width={1000} height={600} tabIndex={0} role="img" aria-label="First-person racetrack and cockpit. Arrow keys or WASD steer, accelerate and brake. Space brakes. P pauses. You can also drag to steer." onKeyDown={event=>{const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','p'].includes(key)){event.preventDefault();if(key==='p'&&!event.repeat&&live)pause(!pausedRef.current);else keys.current.add(key)}}} onKeyUp={event=>keys.current.delete(event.key.toLowerCase())} onPointerDown={event=>{if(!live||pausedRef.current)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);const rect=event.currentTarget.getBoundingClientRect();drag.current=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2))}} onPointerMove={event=>{if(drag.current===null)return;const rect=event.currentTarget.getBoundingClientRect();drag.current=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2))}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}>Your browser needs canvas support to play Apex Circuit.</canvas>
      {view.phase==='countdown'&&!paused?<div className="race-countdown" role="status"><span>LIGHTS OUT IN</span><strong>{Math.max(1,Math.ceil(view.countdown))}</strong></div>:null}
      {paused||view.phase==='ready'||view.phase==='over'?<div className="race-overlay"><div className="race-overlay-card"><span>{paused?'PIT STOP':view.phase==='ready'?'WELCOME TO APEX CIRCUIT':view.finished?'CHEQUERED FLAG':'BACK TO THE PADDOCK'}</span><h2>{paused?'Hold your line.':view.phase==='ready'?'Find your racing line.':view.finished?'That’s a finish.':'Another run?'}</h2><p>{paused?'Your race is paused. Take a breath, then get back out there.':view.phase==='ready'?'Three laps. A winding circuit. A cockpit with a view. Keep it on the tarmac and chase your cleanest run.':view.finished?`${formatTime(view.elapsed)} total. ${view.penalties} contacts. ${view.score.toLocaleString()} points.`:'The clock ran out. Brake before the bends and keep away from the barriers to carry more speed.'}</p>{view.phase==='over'&&view.finished?<a className="race-score-link" href="#apex-circuit-scores">Save your score ↓</a>:null}<button className="race-start" onClick={()=>{if(paused){pause(false);canvas.current?.focus({preventScroll:true})}else begin()}}>{paused?'Back on track':view.phase==='ready'?'Start your engines':'Race again'}<span aria-hidden="true">↗</span></button><small>AUTO THROTTLE ON BY DEFAULT · KEYBOARD / TOUCH / DRAG</small></div></div>:null}
    </div>
    <div className="race-controls">{controlButton('left','←','Steer left')}{controlButton('right','→','Steer right')}{controlButton('gas','↑','Accelerate')}{controlButton('brake','↓','Brake')}<div className="race-options"><button className="race-small" aria-pressed={automatic} onClick={()=>{autoRef.current=!autoRef.current;setAutomatic(autoRef.current);if(live)canvas.current?.focus({preventScroll:true})}}>Auto throttle {automatic?'on':'off'}</button><button className="race-small" aria-pressed={sound} onClick={toggleSound}>Sound {sound?'on':'off'}</button></div></div>
    <div className="race-status"><span role="status" aria-live="polite">{paused?'Race paused.':view.notice}</span><span>{Math.max(0,Math.ceil(TIME_LIMIT-view.elapsed))}s LEFT <b>·</b> {view.penalties} CONTACTS</span></div>
  </section><Leaderboard game="apex-circuit" run={ranking.run} rankingError={ranking.rankingError} result={view.phase==='over'&&view.finished?{score:view.score,stats:{elapsed:view.elapsed,laps:view.laps,penalties:view.penalties,distance:view.distance}}:null}/></>;
}
