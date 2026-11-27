/* My First Ceilidh — V2.9.3 scoring rules.
   The opening 16-beat spin rewards sustained average speed approaching the launch threshold. 200 is unachievable on a successful run.
   Every later dancer is scored SOLELY on the timestamp of the initial grab.
   Spin angle, subsequent spin speed and release time DO NOT affect points or grade.
   Maximum: ten timed grabs (100 each) + opening (200) + finish (50) = 1,250. */
(function(root){
  'use strict';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const gradeOrder={S:7,A:6,B:5,C:4,D:3,E:2,F:1,DNF:0};
  const rank=grade=>gradeOrder[String(grade||'').toUpperCase()]??-1;
  function compare(a,b){return rank(b.grade)-rank(a.grade) || (Number(b.score)||0)-(Number(a.score)||0)}
  function grabPoints(error){
    const e=Math.abs(Number(error));
    if(!Number.isFinite(e))return 0;
    if(e<=.25)return 100;
    if(e<=.5)return Math.round(100-(e-.25)*60); // 100 -> 85
    if(e<=1)return Math.round(85-(e-.5)*90);    // 85 -> 40
    if(e<=2)return Math.round(40-(e-1)*30);    // 40 -> 10
    return 0;
  }
  // Time at the GRAB, not how far/fast somebody spins afterwards.
  function timedGrab({engageError}){
    const e=Math.abs(Number(engageError));
    const valid=Number.isFinite(e);
    const missed=!valid||e>2;
    const muddy=!missed&&e>1;
    const points=missed?0:grabPoints(e);
    return {points,grabPoints:points,spinPoints:0,
      error:valid?e:Infinity,missed,muddy,
      excellent:!missed&&e<=.5,accurate:!missed&&e<=1};
  }
  // Backwards-compatible alias for older harnesses; intentionally ignores angle/speed.
  function spinTurn({engageError}){return timedGrab({engageError})}
  // Opening: 200 is intentionally unachievable in a successful run.
  // The 5.85 rad/s danger line is the beginning of the launch mechanic; points
  // scale steeply with TIME-WEIGHTED AVERAGE speed as you approach that line.
  // Short bursts do not compensate for a mostly slow spin, and players may brake.
  function opening({releasedAt,peakSpeed,heldSeconds,heldBeats,rotations}){
    const turns=Math.max(0,Number(rotations)||0);
    const seconds=Math.max(0,Number(heldSeconds)||0);
    const beats=clamp(Number(heldBeats)||0,0,16);
    const avg=seconds>.001?turns*2*Math.PI/seconds:0;
    const LAUNCH_LINE=5.85; // Keep in sync with the opening flight check in index.html.
    // Sustaining the spin for 13+ beats gives full duration credit; this leaves
    // time to release and reach the first outside dancer on beat 16.
    const duration=clamp((beats-3)/10,0,1);
    const speedRatio=clamp(avg/LAUNCH_LINE,0,1);
    const points=Math.min(199,Math.floor(200*Math.pow(speedRatio,4.0)*Math.pow(duration,.55)));
    const tier=beats>=11&&avg>=5.0?'ELITE':beats>=8&&avg>=4.15?'FAST':beats>=5&&avg>=2.85?'STANDARD':'SLOW';
    return {tier,points,averageSpeed:avg,peakSpeed:Math.max(0,Number(peakSpeed)||0),heldBeats:beats,
      rotations:turns,releasedAt:clamp(Number(releasedAt)||0,0,16)};
  }
  function finishPoints(error){const e=Math.abs(Number(error)||0);return e<=.5?50:e<=1?40:e<=2?20:0}
  function evaluate({turns,openingResult,mistakes=0,finishError=0,completed=true}){
    const results=Array.isArray(turns)?turns:[];
    const misses=results.filter(r=>r.missed).length;
    const muddy=results.filter(r=>r.muddy).length;
    const excellent=results.filter(r=>r.excellent).length;
    const accurate=results.filter(r=>r.accurate).length;
    const tier=openingResult?.tier||'SLOW';
    const incidents=Math.max(0,Math.floor(Number(mistakes)||0));
    const total=Math.round(clamp(results.reduce((sum,r)=>sum+(r.points||0),0)+(openingResult?.points||0)+(completed?finishPoints(finishError):0),0,1250));
    const precision=results.length?Math.round(100*results.reduce((sum,r)=>sum+clamp(1-r.error/2,0,1),0)/results.length):0;
    let grade='DNF';
    if(completed&&results.length===10){
      const noMistakes=incidents===0, noMisses=misses===0;
      if(noMistakes&&noMisses&&excellent===10&&tier==='ELITE') grade='S';
      else if(noMistakes&&noMisses&&accurate===10&&(tier==='ELITE'||tier==='FAST'))grade='A';
      else if(noMistakes&&noMisses&&muddy<=1&&tier!=='SLOW')grade='B';
      else if(noMistakes&&noMisses&&muddy<=2)grade='C';
      else if(misses<=2&&muddy<=5)grade='D';
      else if(misses<=4&&muddy<=7)grade='E';
      else grade='F';
    }
    return {grade,total,precision,misses,muddy,excellent,accurate,incidents,
      openingTier:tier,openingPoints:openingResult?.points||0,openingAverageSpeed:openingResult?.averageSpeed||0,
      finishPoints:completed?finishPoints(finishError):0,turnsCompleted:results.length,completed:!!completed};
  }
  const api={grabPoints,timedGrab,spinTurn,opening,finishPoints,evaluate,compare,rank};
  root.CEILIDH_SCORING=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
