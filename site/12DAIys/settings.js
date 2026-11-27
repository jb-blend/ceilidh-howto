/* GitHub Pages V2.4 preview: read production music/BPM, use local-only scores. */
(function(){
  const live=window.CEILIDH_CONFIG||{};
  const source=String(live.musicFile||'assets/ceilidh-track.mp3');
  const path=/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(source)?source:'../'+source.replace(/^\.\//,'');
  window.CEILIDH_CONFIG={...live,countInBeats:live.countInBeats===32?32:16,musicFile:path,leaderboardApi:''};
})();
