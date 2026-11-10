'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {GameName} from '../../lib/leaderboard';
import './leaderboard.css';
export type RankedResult={score:number;stats:Record<string,number>};
type Entry={id:string;nickname:string;score:number;createdAt:number;hidden?:number};
export function useRankedRun(game:GameName){
  const [run,setRun]=useState<string|null>(null),[rankingError,setRankingError]=useState(''),sequence=useRef(0);
  const begin=useCallback(()=>{
    const seq=++sequence.current;setRun(null);setRankingError('');
    void fetch(`/api/leaderboard/${game}/run`,{method:'POST',signal:AbortSignal.timeout(8000)}).then(async r=>{const data=await r.json() as {run:string;error?:string};if(seq!==sequence.current)return;if(!r.ok)throw Error(data.error||'Ranked scores are unavailable.');setRun(data.run)}).catch(e=>{if(seq===sequence.current)setRankingError(e instanceof Error?e.message:'Ranked scores are unavailable.')});
  },[game]);
  return {run,rankingError,begin};
}
export default function Leaderboard({game,result,run,rankingError}:{game:GameName;result:RankedResult|null;run:string|null;rankingError:string}){
  const title=game==='apex-circuit'?'Apex Circuit':game==='duck-creek'?'Duck Creek':'Reef Runner';
  const [entries,setEntries]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[error,setError]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[savedRun,setSavedRun]=useState(''),[owner,setOwner]=useState(false),[manage,setManage]=useState(false),[refresh,setRefresh]=useState(0);
  useEffect(()=>{let active=true;void fetch('/api/session').then(r=>r.json() as Promise<{canManage?:boolean}>).then(d=>{if(active)setOwner(d.canManage===true)}).catch(()=>{});return()=>{active=false}},[]);
  useEffect(()=>{let active=true;setLoading(true);setLoadError('');void fetch(`/api/leaderboard/${game}${manage?'?manage=1':''}`).then(async r=>{const d=await r.json() as {entries:Entry[];error?:string};if(!r.ok)throw Error(d.error||'The leaderboard is unavailable.');if(active)setEntries(d.entries)}).catch(e=>{if(active)setLoadError(e instanceof Error?e.message:'Could not load scores.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[game,manage,refresh]);
  useEffect(()=>{setError('')},[run]);
  async function submit(event:React.FormEvent){
    event.preventDefault();if(!result||!run||busy)return;setBusy(true);setError('');
    try{
      const r=await fetch(`/api/leaderboard/${game}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({run,nickname:name,score:result.score,stats:result.stats})});const d=await r.json() as {error?:string};if(!r.ok)throw Error(d.error||'Your score could not be saved.');setSavedRun(run);setRefresh(n=>n+1);
    }catch(e){setError(e instanceof Error?e.message:'Your score could not be saved.')}finally{setBusy(false)}
  }
  async function visibility(entry:Entry){setError('');try{const r=await fetch(`/api/leaderboard/${game}/${entry.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({hidden:!entry.hidden})});if(!r.ok)throw Error('Could not update this score.');setRefresh(n=>n+1)}catch(e){setError(e instanceof Error?e.message:'Could not update this score.')}}
  return <section id={`${game}-scores`} className={`scoreboard scoreboard-${game}`} aria-label={`${title} leaderboard`}>
    <div className="scoreboard-heading"><div><p>THE FRIENDLY COMPETITION</p><h2>{game==='reef-runner'?'Reef legends.':game==='apex-circuit'?'Circuit legends.':'Marsh legends.'}<span>{title} leaderboard</span></h2></div><span>TOP 20 · ALL TIME</span></div>
    {result&&result.score>0?<div className="scoreboard-submit">{run&&savedRun===run?<p className="scoreboard-success" role="status">Your score is saved. Thanks for playing!</p>:<><div><h3>Put your score on the board.</h3><p>{result.score.toLocaleString()} points. Share a nickname if you’d like to join the leaderboard.</p></div>{rankingError?<p className="scoreboard-error" role="status">{rankingError} Your personal best stays on this device.</p>:<form onSubmit={submit}><label htmlFor={`${game}-nickname`}>Public nickname</label><div><input id={`${game}-nickname`} name="nickname" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={20} pattern="[A-Za-z0-9][A-Za-z0-9 _\.\-]{1,19}" placeholder="e.g. Stargazer" autoComplete="off" required disabled={busy}/><button disabled={busy||!run} type="submit">{busy?'Saving…':run?'Save score':'Preparing…'}</button></div><small>Your nickname and score will be public. Use a nickname, not your real name or contact details. Nicknames aren’t reserved.</small></form>}</> }</div>:<p className="scoreboard-invitation">Finish a game with points to save your score here. No sign-in needed.</p>}
    {error?<p className="scoreboard-error" role="alert">{error}</p>:null}
    {owner?<button className="scoreboard-manage" onClick={()=>setManage(!manage)}>{manage?'Show public leaderboard':'Manage scores'}</button>:null}
    {loading?<p className="scoreboard-loading" role="status">Loading scores…</p>:loadError?<div className="scoreboard-error" role="status">{loadError} <button onClick={()=>setRefresh(n=>n+1)}>Try again</button></div>:entries.length?<ol className="scoreboard-list">{entries.map((entry,index)=><li key={entry.id} className={entry.hidden?'score-hidden':''}><span className="scoreboard-rank">{String(index+1).padStart(2,'0')}</span><span className="scoreboard-name">{entry.nickname}{entry.hidden?<small>Hidden</small>:null}</span><strong>{entry.score.toLocaleString()}</strong><time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time>{owner&&manage?<button onClick={()=>visibility(entry)}>{entry.hidden?'Restore':'Hide'}</button>:null}</li>)}</ol>:<p className="scoreboard-empty">The board is wide open. Be the first to leave your mark.</p>}
    <p className="scoreboard-footnote">Scores from completed games only. Basic score checks and submission limits help keep things fair.</p>{!owner?<a className="scoreboard-signin" href={'/signin-with-chatgpt?return_to='+encodeURIComponent('/'+game+'#'+game+'-scores')}>Sign in to manage</a>:null}
  </section>;
}
