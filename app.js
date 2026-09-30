const DATA_URL="data.json";
let data={},juz=1,page=1,audio=null,card=null,repeatLeft=0,slow=false;

const ranges={1:[1,22],2:[22,42]};
const $=id=>document.getElementById(id);

async function init(){
  data=await (await fetch(DATA_URL)).json();
  buildPages();
  render();
}

function buildPages(){
  const [a,b]=ranges[juz];
  $("page").innerHTML="";
  for(let p=a;p<=b;p++){
    const o=document.createElement("option");
    o.value=p;
    o.textContent=`Page ${p}`;
    $("page").appendChild(o);
  }
  $("page").value=page;
}

function clearLearning(){
  document.querySelectorAll(".ayah.learning").forEach(el=>el.classList.remove("learning"));
  card=null;
}

function stop(){
  if(audio){
    audio.pause();
    audio.currentTime=0;
  }
  clearLearning();
  audio=null;
  repeatLeft=0;
}

function setLearning(c,on){
  if(on){
    document.querySelectorAll(".ayah.learning").forEach(el=>{
      if(el!==c) el.classList.remove("learning");
    });
    c.classList.add("learning");
    card=c;
  }else{
    c.classList.remove("learning");
    if(card===c) card=null;
  }
}

function render(){
  stop();
  const list=data[String(page)]||[];
  $("content").innerHTML="<div class=note>Listen • Pause • Slow down • Repeat and read aloud</div>";

  list.forEach(v=>{
    const c=document.createElement("article");
    c.className="ayah";

    const t=document.createElement("div");
    t.className="arabic";
    t.textContent=v.text;

    const n=document.createElement("span");
    n.className="num";
    n.textContent=v.a;
    t.appendChild(n);

    const a=document.createElement("div");
    a.className="actions";

    const listen=btn("▶ Listen");
    const pause=btn("⏸ Pause");
    const slower=btn("🐢 Slower");
    const repeat=btn("🔁 Repeat 3×");

    a.append(listen,pause,slower,repeat);
    c.append(t,a);
    $("content").appendChild(c);

    function make(){
      if(!audio){
        audio=new Audio(
          `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${String(v.s).padStart(3,"0")}${String(v.a).padStart(3,"0")}.mp3`
        );

        audio.preload="auto";

        audio.onplay=()=>{
          setLearning(c,true);
        };

        audio.onpause=()=>{
          if(audio && !audio.ended) setLearning(c,false);
        };

        audio.onended=()=>{
          setLearning(c,false);

          if(repeatLeft>0){
            repeatLeft--;
            audio.currentTime=0;
            setLearning(c,true);
            audio.play();
          }
        };

        audio.onerror=()=>{
          setLearning(c,false);
          alert("Audio could not be loaded. Please try again.");
        };
      }
      return audio;
    }

    listen.onclick=()=>{
      const x=make();
      stopOther(x,c);
      repeatLeft=0;
      x.playbackRate=1;
      x.currentTime=0;
      setLearning(c,true);
      x.play();
    };

    pause.onclick=()=>{
      if(audio && audio===make() && !audio.paused){
        audio.pause();
        return;
      }

      const x=make();
      stopOther(x,c);
      x.play();
    };

    slower.onclick=()=>{
      const x=make();
      stopOther(x,c);
      x.playbackRate=slow ? 0.5 : 0.75;
      slow=!slow;
      slower.textContent=slow ? "🐢 Very Slow" : "🐢 Slower";
      setLearning(c,true);
      x.play();
    };

    repeat.onclick=()=>{
      const x=make();
      stopOther(x,c);
      repeatLeft=2;
      x.playbackRate=0.75;
      x.currentTime=0;
      setLearning(c,true);
      x.play();
    };
  });
}

function stopOther(x,c){
  if(audio && audio!==x){
    audio.pause();
    audio.currentTime=0;
  }
  clearLearning();
  audio=x;
  card=c;
}

function btn(t){
  const b=document.createElement("button");
  b.textContent=t;
  return b;
}

$("j1").onclick=()=>{
  juz=1; page=1;
  $("j1").classList.add("active");
  $("j2").classList.remove("active");
  buildPages();
  render();
};

$("j2").onclick=()=>{
  juz=2; page=22;
  $("j2").classList.add("active");
  $("j1").classList.remove("active");
  buildPages();
  render();
};

$("page").onchange=e=>{
  page=+e.target.value;
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
