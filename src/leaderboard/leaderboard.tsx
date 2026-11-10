import {useState} from 'react';
import './leaderboard.css';
type GameName='duck-creek'|'apex-circuit';
type Result={score:number;stats:Record<string,number>};
type Entry={id:string;nickname:string;score:number;createdAt:number};
function read(game:GameName):Entry[]{try{const rows=JSON.parse(localStorage.getItem(game+'-standalone-scores')||'[]');return Array.isArray(rows)?rows.filter((r:Entry)=>typeof r.nickname==='string'&&Number.isFinite(r.score)&&Number.isFinite(r.createdAt)).slice(0,20):[]}catch{return []}}
export function useRankedRun(_game:GameName){
  const [run,setRun]=useState<string|null>(null);
  return {run,rankingError:'',begin:()=>setRun(crypto.randomUUID())};
}
export default function Leaderboard({game,result,run}:{game:GameName;result:Result|null;run:string|null;rankingError:string}){
  const title=game==='duck-creek'?'Duck Creek':'Apex Circuit';
  const [entries,setEntries]=useState(()=>read(game)),[name,setName]=useState(''),[saved,setSaved]=useState(''),[error,setError]=useState('');
  function submit(event:React.FormEvent){
    event.preventDefault();if(!run||!result||result.score<=0||saved===run)return;
    if(!/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$/.test(name.trim())){setError('Choose a nickname with 2 to 20 letters, numbers, spaces, dots or underscores.');return}
    const next=[...read(game),{id:run,nickname:name.trim(),score:Math.round(result.score),createdAt:Date.now()}].sort((a,b)=>b.score-a.score).slice(0,20);
    try{localStorage.setItem(game+'-standalone-scores',JSON.stringify(next));setEntries(next);setSaved(run);setError('')}catch{setError('This browser could not save the score. Your game is still playable.')}
  }
  return <section id={game+'-scores'} className={'scoreboard scoreboard-'+game} aria-label={title+' local leaderboard'}>
    <div className="scoreboard-heading"><div><p>YOUR LOCAL COMPETITION</p><h2>{game==='duck-creek'?'Marsh legends.':'Circuit legends.'}<span>{title} leaderboard</span></h2></div><span>TOP 20 · THIS BROWSER</span></div>
    {result&&result.score>0?<div className="scoreboard-submit">{saved===run?<p className="scoreboard-success" role="status">Your score is saved in this browser.</p>:<><h3>{result.score.toLocaleString()} points. Save your finish.</h3><form onSubmit={submit}><label htmlFor="nickname">Nickname</label><div><input id="nickname" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={20} required autoComplete="off"/><button type="submit" disabled={!run}>Save score</button></div><small>Saved only on this device and browser.</small></form></>}</div>:<p className="scoreboard-invitation">Finish a game to save a score in this browser.</p>}
    {error?<p className="scoreboard-error" role="alert">{error}</p>:null}
    {entries.length?<ol className="scoreboard-list">{entries.map((entry,index)=><li key={entry.id}><span className="scoreboard-rank">{index+1}</span><span className="scoreboard-name">{entry.nickname}</span><strong>{entry.score.toLocaleString()}</strong><time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleDateString()}</time></li>)}</ol>:<p className="scoreboard-empty">The board is wide open.</p>}
    <p className="scoreboard-footnote">Standalone edition: scores stay in this browser. <a href={'https://marcusheygster.com/'+game+'#'+game+'-scores'}>Play on Marcus’s website for the shared leaderboard ↗</a></p>
  </section>
}
