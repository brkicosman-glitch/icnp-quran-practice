const DATA_URL="data.json";

let data={};
let juz=1;
let page=1;
let currentAudio=null;
let currentCard=null;
let repeatLeft=0;
let slowMode=false;

const ranges={1:[1,22],2:[22,42]};
const $=id=>document.getElementById(id);

async function init(){
  data=await (await fetch(DATA_URL)).json();
  buildPages();
  render();
}

function buildPages(){
  const [start,end]=ranges[juz];
  $("page").innerHTML="";
  for(let p=start;p<=end;p++){
    const o=document.createElement("option");
    o.value=p;
    o.textContent=`Page ${p}`;
    $("page").appendChild(o);
  }
  $("page").value=page;
}

function stopCurrent(){
  if(currentAudio){
    currentAudio.pause();
    currentAudio.currentTime=0;
  }
  clearHighlight();
  currentAudio=null;
  currentCard=null;
  repeatLeft=0;
}

function clearHighlight(){
  document.querySelectorAll(".word.active").forEach(w=>w.classList.remove("active"));
  document.querySelectorAll(".ayah.playing").forEach(c=>c.classList.remove("playing"));
}

function highlightWord(card, index){
  card.querySelectorAll(".word").forEach((w,i)=>{
    w.classList.toggle("active",i===index);
  });
  card.classList.add("playing");
}

function makeAudio(v,card){
  const src=`https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${String(v.s).padStart(3,"0")}${String(v.a).padStart(3,"0")}.mp3`;
  const audio=new Audio(src);
  audio.preload="auto";

  audio.addEventListener("loadedmetadata",()=>{
    syncWords(audio,card);
  });

  audio.addEventListener("timeupdate",()=>{
    syncWords(audio,card);
  });

  audio.addEventListener("play",()=>{
    currentAudio=audio;
    currentCard=card;
    card.classList.add("playing");
  });

  audio.addEventListener("pause",()=>{
    if(!audio.ended){
      card.classList.remove("playing");
    }
  });

  audio.addEventListener("ended",()=>{
    clearHighlight();

    if(repeatLeft>0 && currentAudio===audio){
      repeatLeft--;
      audio.currentTime=0;
      audio.play();
    }else if(currentAudio===audio){
      currentAudio=null;
      currentCard=null;
      repeatLeft=0;
    }
  });

  audio.addEventListener("error",()=>{
    if(currentAudio===audio){
      clearHighlight();
      currentAudio=null;
      currentCard=null;
    }
    alert("Audio could not be loaded. Please try again.");
  });

  return audio;
}

/*
  The EveryAyah file is one complete ayah. Its public MP3 does not carry
  word timestamps, so this browser-only version follows the recitation by
  distributing the measured audio duration across the words. This keeps
  the highlighting synchronized without another API or login.
*/
function syncWords(audio,card){
  if(!audio.duration || !isFinite(audio.duration)) return;

  const words=[...card.querySelectorAll(".word")];
  if(!words.length) return;

  const weights=words.map(w=>{
    const clean=w.textContent.replace(/[ۖ-ۭٱ]/g,"");
    return Math.max(1,[...clean].length);
  });

  const total=weights.reduce((a,b)=>a+b,0);
  // Start highlighting slightly early so the visual cue leads the recitation.
  const lead=0.15;
  const t=Math.max(0,audio.currentTime+lead);
  let elapsed=0;
  let active=words.length-1;

  for(let i=0;i<words.length;i++){
    const end=audio.duration*(elapsed+weights[i])/total;
    if(t<=end){
      active=i;
      break;
    }
    elapsed+=weights[i];
  }

  highlightWord(card,active);
}

function render(){
  stopCurrent();

  const list=data[String(page)]||[];
  $("content").innerHTML="<div class='note'>Listen • Pause • Slower • Repeat 3× • Follow the words as they are recited</div>";

  list.forEach(v=>{
    const card=document.createElement("article");
    card.className="ayah";

    const text=document.createElement("div");
    text.className="arabic";

    const words=v.text.trim().split(/\s+/);
    words.forEach((word,i)=>{
      const span=document.createElement("span");
      span.className="word";
      span.textContent=word;
      text.appendChild(span);
      if(i<words.length-1) text.appendChild(document.createTextNode(" "));
    });

    const num=document.createElement("span");
    num.className="num";
    num.textContent=v.a;
    text.appendChild(num);

    const actions=document.createElement("div");
    actions.className="actions";

    const listen=btn("▶ Listen");
    const pause=btn("⏸ Pause");
    const slower=btn("🐢 Slower");
    const repeat=btn("🔁 Repeat 3×");

    actions.append(listen,pause,slower,repeat);
    card.append(text,actions);
    $("content").appendChild(card);

    let myAudio=null;

    function getAudio(){
      if(!myAudio) myAudio=makeAudio(v,card);
      return myAudio;
    }

    listen.onclick=()=>{
      const a=getAudio();
      if(currentAudio && currentAudio!==a){
        currentAudio.pause();
        currentAudio.currentTime=0;
      }
      clearHighlight();
      repeatLeft=0;
      a.playbackRate=1;
      a.currentTime=0;
      currentAudio=a;
      currentCard=card;
      a.play();
    };

    pause.onclick=()=>{
      if(myAudio && !myAudio.paused){
        myAudio.pause();
      }
    };

    slower.onclick=()=>{
      const a=getAudio();
      if(currentAudio && currentAudio!==a){
        currentAudio.pause();
        currentAudio.currentTime=0;
      }
      clearHighlight();
      repeatLeft=0;
      slowMode=!slowMode;
      a.playbackRate=slowMode ? 0.65 : 0.85;
      slower.textContent=slowMode ? "🐢 Normal Slow" : "🐢 Slower";
      currentAudio=a;
      currentCard=card;
      a.play();
    };

    repeat.onclick=()=>{
      const a=getAudio();
      if(currentAudio && currentAudio!==a){
        currentAudio.pause();
        currentAudio.currentTime=0;
      }
      clearHighlight();
      repeatLeft=2;
      a.playbackRate=0.85;
      a.currentTime=0;
      currentAudio=a;
      currentCard=card;
      a.play();
    };
  });
}

function btn(text){
  const b=document.createElement("button");
  b.type="button";
  b.textContent=text;
  return b;
}

$("j1").onclick=()=>{
  juz=1;
  page=1;
  $("j1").classList.add("active");
  $("j2").classList.remove("active");
  buildPages();
  render();
};

$("j2").onclick=()=>{
  juz=2;
  page=22;
  $("j2").classList.add("active");
  $("j1").classList.remove("active");
  buildPages();
  render();
};

$("page").onchange=e=>{
  page=Number(e.target.value);
  render();
};

$("prev").onclick=()=>{
  if(page>ranges[juz][0]){
    page--;
    $("page").value=page;
    render();
  }
};

$("next").onclick=()=>{
  if(page<ranges[juz][1]){
    page++;
    $("page").value=page;
    render();
  }
};

init();
