const API = "https://quranonlineread.com/api/surah/";
const AUDIO = n => `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${String(n).padStart(3,"0")}.mp3`;

let currentJuz = 1;
let currentPage = 1;
const pages = {
  1: {start:1,end:22},
  2: {start:22,end:42}
};

const pageSelect = document.getElementById("pageSelect");
const ayahList = document.getElementById("ayahList");
const pageTitle = document.getElementById("pageTitle");
const juz1 = document.getElementById("juz1");
const juz2 = document.getElementById("juz2");

function buildPageOptions(){
  pageSelect.innerHTML = "";
  const p = pages[currentJuz];
  for(let n=p.start;n<=p.end;n++){
    const o=document.createElement("option");
    o.value=n; o.textContent=`Page ${n}`;
    pageSelect.appendChild(o);
  }
  pageSelect.value=currentPage;
}

function setJuz(j){
  currentJuz=j;
  currentPage=pages[j].start;
  juz1.classList.toggle("active",j===1);
  juz2.classList.toggle("active",j===2);
  buildPageOptions();
  loadPage();
}

async function loadPage(){
  pageTitle.textContent=`Page ${currentPage}`;
  ayahList.innerHTML=`<div class="loading">Loading Qur'an page ${currentPage}…</div>`;
  try{
    const results=[];
    for(let s=1;s<=114;s++){
      const r=await fetch(`${API}${s}.json`);
      if(!r.ok) continue;
      const data=await r.json();
      const verses=data.verses || data.ayahs || [];
      for(const a of verses){
        if(Number(a.page)===currentPage){
          results.push({
            surah:s,
            ayah:Number(a.number),
            key:a.key || `${s}:${a.number}`,
            arabic:a.arabic
          });
        }
      }
      if(results.length && Number(data.verses?.at(-1)?.page || 0)>currentPage) break;
    }
    if(!results.length){
      ayahList.innerHTML=`<div class="error">No verses found for page ${currentPage}. Check the page range and connection.</div>`;
      return;
    }
    render(results);
  }catch(e){
    ayahList.innerHTML=`<div class="error">Could not load the Qur'an data. Please check your internet connection and try again.</div>`;
  }
}

function render(items){
  ayahList.innerHTML="";
  const note=document.createElement("div");
  note.className="practice-note";
  note.textContent="Listen to each ayah, then repeat it aloud.";
  ayahList.appendChild(note);

  items.forEach(item=>{
    const card=document.createElement("article");
    card.className="ayah";
    const ar=document.createElement("div");
    ar.className="arabic";
    ar.innerHTML=`${escapeHtml(item.arabic)} <span class="ayah-number">${item.ayah}</span>`;
    card.appendChild(ar);

    const actions=document.createElement("div");
    actions.className="actions";
    const play=document.createElement("button");
    play.textContent="▶ Listen";
    const repeat=document.createElement("button");
    repeat.textContent="🔁 Repeat 3×";
    let audio=null;
    let count=0;

    function makeAudio(){
      // EveryAyah uses surah/ayah numbering in separate path/file.
      const [s,a]=item.key.split(":").map(Number);
      const url=`https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${String(s).padStart(3,"0")}${String(a).padStart(3,"0")}.mp3`;
      if(!audio){ audio=new Audio(url); audio.preload="none"; }
      return audio;
    }

    play.onclick=()=>{
      const au=makeAudio();
      au.currentTime=0; au.play();
    };
    repeat.onclick=()=>{
      const au=makeAudio();
      count=0;
      au.onended=()=>{
        count++;
        if(count<3){au.currentTime=0; au.play();}
      };
      au.currentTime=0; au.play();
    };

    actions.append(play,repeat);
    card.appendChild(actions);
    ayahList.appendChild(card);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

juz1.onclick=()=>setJuz(1);
juz2.onclick=()=>setJuz(2);
pageSelect.onchange=()=>{currentPage=Number(pageSelect.value);loadPage();};
document.getElementById("prevPage").onclick=()=>{
  if(currentPage>pages[currentJuz].start){currentPage--;pageSelect.value=currentPage;loadPage();}
};
document.getElementById("nextPage").onclick=()=>{
  if(currentPage<pages[currentJuz].end){currentPage++;pageSelect.value=currentPage;loadPage();}
};

buildPageOptions();
loadPage();
