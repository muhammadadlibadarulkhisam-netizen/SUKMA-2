

const syllableConsonants = [
  "b","c","d","f","g","h","j","k","l","m","n","p","q","r","s","t","v","w","x","y","z"
];

const syllables = syllableConsonants.flatMap(letter => [
  { display: `${letter}a`, label: "suku kata a", sound: `${letter}a`, audioKeys: [`${letter}a`] },
  { display: `${letter}i`, label: "suku kata i", sound: `${letter}i`, audioKeys: [`${letter}i`] },
  { display: `${letter}u`, label: "suku kata u", sound: `${letter}u`, audioKeys: [`${letter}u`] },
  { display: `${letter}ǝ`, label: "suku kata e pepet", sound: `${letter}ə`, audioKeys: [`${letter}ǝ`, `${letter}ə`, `${letter}e-pepet`, `${letter}e_pepet`, `${letter}e pepet`] },
  { display: `${letter}e`, label: "suku kata e taling", sound: `${letter}e`, audioKeys: [`${letter}e`, `${letter}e-taling`, `${letter}e_taling`, `${letter}e taling`] },
  { display: `${letter}o`, label: "suku kata o", sound: `${letter}o`, audioKeys: [`${letter}o`] }
]);

const vowels = [
  { display: "a", label: "vokal a", sound: "a", audioKeys: ["a"] },
  { display: "i", label: "vokal i", sound: "i", audioKeys: ["i"] },
  { display: "u", label: "vokal u", sound: "u", audioKeys: ["u"] },
  { display: "o", label: "vokal o", sound: "o", audioKeys: ["o"] },
  { display: "ǝ", label: "e pepet", sound: "e pepet", audioKeys: ["ǝ", "e-pepet", "e_pepet", "e pepet", "pepet"] },
  { display: "e", label: "e taling", sound: "e taling", audioKeys: ["e", "e-taling", "e_taling", "e taling", "taling"] }
];

const consonants = [
  "b","c","d","f","g","h","j","k","l","m","n","p","q","r","s","t","v","w","x","y","z"
].map(letter => ({
  display: letter,
  label: `konsonan ${letter}`,
  sound: letter,
  audioKeys: [letter]
}));

let voices = [];
let currentAudio = null;

// AUDIO SENDIRI / CUSTOM AUDIO
// Cara kekal: letak fail audio dalam folder "audio" dan aktifkan contoh di bawah.
// Contoh: const permanentAudio = { ba: "audio/ba.mp3", bi: "audio/bi.mp3" };
const permanentAudio = {
  ba: "audio/ba.mp3",
  bi: "audio/bi.mp3",
  bu: "audio/bu.mp3"
};
let customAudio = { ...permanentAudio };

const voiceSelect = document.getElementById('voiceSelect');
const testVoice = document.getElementById('testVoice');
const audioUpload = document.getElementById('audioUpload');
const audioStatus = document.getElementById('audioStatus');

function stopAudio(){
  if('speechSynthesis' in window) speechSynthesis.cancel();
  if(currentAudio){
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function normaliseAudioKey(filename){
  return filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .trim();
}

function loadCustomAudioFiles(files){
  let count = 0;
  Array.from(files).forEach(file => {
    if(!file.type.startsWith('audio/')) return;
    const key = normaliseAudioKey(file.name);
    customAudio[key] = URL.createObjectURL(file);
    count++;
  });

  audioStatus.textContent = count
    ? `${count} audio berjaya dimuat naik. Klik kad untuk dengar suara sendiri.`
    : 'Tiada fail audio yang sah dipilih.';
}

function playCustomAudio(key, onEnded){
  const src = customAudio[key];
  if(!src) return false;
  stopAudio();
  currentAudio = new Audio(src);
  currentAudio.onended = () => {
    currentAudio = null;
    if(typeof onEnded === 'function') onEnded();
  };
  currentAudio.play().catch(() => {
    audioStatus.textContent = `Audio untuk "${key}" tidak dapat dimainkan. Cuba format MP3 atau WAV.`;
    if(typeof onEnded === 'function') onEnded();
  });
  return true;
}

function loadVoices(){
  if(!('speechSynthesis' in window)){
    voiceSelect.innerHTML = '<option>Suara tidak disokong</option>';
    return;
  }

  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  const sortedVoices = voices.slice().sort((a,b)=>{
    const aPref = /ms|id/i.test(a.lang) ? 0 : 1;
    const bPref = /ms|id/i.test(b.lang) ? 0 : 1;
    return aPref-bPref || a.name.localeCompare(b.name);
  });

  if(!sortedVoices.length){
    const opt = document.createElement('option');
    opt.textContent = "Suara browser default";
    opt.value = "";
    voiceSelect.appendChild(opt);
    return;
  }

  sortedVoices.forEach((v)=>{
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });

  const preferred = sortedVoices.find(v => /ms-MY/i.test(v.lang)) || sortedVoices.find(v => /id-ID/i.test(v.lang));
  if(preferred) voiceSelect.value = preferred.name;
}

function getSelectedVoice(){
  return voices.find(v => v.name === voiceSelect.value) || voices.find(v => /ms-MY/i.test(v.lang)) || voices.find(v => /id-ID/i.test(v.lang)) || null;
}

function speak(text, slow=false, audioKeys=null){
  const keys = Array.isArray(audioKeys) ? audioKeys : [audioKeys || text];
  const foundKey = keys
    .map(k => String(k).trim().toLowerCase())
    .find(k => customAudio[k]);

  if(foundKey){
    playCustomAudio(foundKey);
    return;
  }

  if(!('speechSynthesis' in window)){
    alert("Browser ini tidak menyokong fungsi suara. Cuba buka dengan Chrome, Edge atau Safari terkini.");
    return;
  }

  stopAudio();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ms-MY";
  utter.rate = slow ? 0.62 : 0.72;
  utter.pitch = 1.08;
  utter.volume = 1;
  const selected = getSelectedVoice();
  if(selected) utter.voice = selected;
  speechSynthesis.speak(utter);
}

function makeCard(item, onClickExtra=null){
  const data = typeof item === 'object'
    ? item
    : { display: item, label: "suku kata", sound: item, audioKeys: [item] };

  const card = document.createElement('button');
  card.className = 'syllableCard';
  card.innerHTML = `${data.display}<span>${data.label} • klik untuk dengar</span>`;
  card.setAttribute('aria-label', `${data.label} ${data.display}`);
  card.addEventListener('click', ()=>{
    card.classList.add('playing');
    setTimeout(()=>card.classList.remove('playing'), 360);
    speak(data.sound, false, data.audioKeys);
    if(typeof onClickExtra === 'function') onClickExtra(data.display);
  });
  return card;
}

function shuffle(arr){
  return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
}

testVoice.addEventListener('click', ()=>speak('a i u o. e pepet. e taling. b c d. ba bi bu. bǝ. be. Jom belajar suku kata.', true));
audioUpload.addEventListener('change', (event)=>loadCustomAudioFiles(event.target.files));

loadVoices();
if('speechSynthesis' in window) speechSynthesis.onvoiceschanged = loadVoices;


const vowelGrid = document.getElementById('vowelGrid');
const consonantGrid = document.getElementById('consonantGrid');
const learnGrid = document.getElementById('learnGrid');

function renderSoundCards(){
  vowels.forEach(v => {
    vowelGrid.appendChild(makeCard(v));
  });

  consonants.forEach(c => {
    consonantGrid.appendChild(makeCard(c));
  });

  syllables.forEach(s => {
    learnGrid.appendChild(makeCard(s));
  });
}
renderSoundCards();

  