import {introView,bindIntro} from './intro.js';
import {homeView,bindHome} from './home.js';
import {workView,labView} from './pages.js';
const main=document.querySelector('#main'),header=document.querySelector('#header');
const homeState={active:'idle',scroll:0,readerScroll:0,focus:null};
let route='',revision=0,home,viewCleanup;
// Reload is an invitation to watch the opening again; deep links still work on fresh visits.
if(performance.getEntriesByType('navigation')[0]?.type==='reload')history.replaceState(null,'',location.pathname+location.search);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,reduced()?0:ms));
function getRoute(){const hash=location.hash.slice(1);return ['work','lab','intro'].includes(hash)?hash:hash?'home':'intro';}
async function render(initial=false){const next=getRoute();const token=++revision;if(next===route){main.classList.remove('page-leaving');if(location.hash==='#contact')home?.querySelector('#contact').scrollIntoView({behavior:reduced()?'instant':'smooth'});return;}if(route==='home'){homeState.scroll=window.scrollY;homeState.readerScroll=home.querySelector('.reader-scroll').scrollTop;homeState.focus=document.activeElement;}
main.classList.add('page-leaving');if(!initial)await wait(route==='intro'?650:280);if(token!==revision)return;
viewCleanup?.();viewCleanup=null;
// Keep the actual home DOM, including expanded text and reader scroll, between routes.
if(home?.isConnected)home.remove();main.replaceChildren();route=next;header.hidden=route==='intro';document.body.classList.toggle('intro-active',route==='intro');document.body.classList.toggle('home-active',route==='home');
if(route==='home'){if(!home){home=document.createElement('div');home.className='home-view';home.innerHTML=homeView();bindHome(home,homeState);}main.append(home);home.querySelector('.reader-scroll').scrollTop=homeState.readerScroll;}else{const view=document.createElement('div');view.className='route-view';view.innerHTML=route==='intro'?introView():route==='work'?workView():labView();main.append(view);if(route==='intro')viewCleanup=bindIntro(view);if(route==='work')viewCleanup=bindPhotoCarousel(view);}
main.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.src='fallback.svg';img.alt='图片暂不可用';},{once:true}));
document.title=({intro:'Nice to meet you',home:'Personal Portfolio',work:'Explore my work',lab:'Content Lab'}[route])+' — FREYA / 訾若晨';
window.scrollTo({top:route==='home'?homeState.scroll:0,behavior:'instant'});main.classList.remove('page-leaving');main.classList.add('page-arriving');requestAnimationFrame(()=>requestAnimationFrame(()=>main.classList.remove('page-arriving')));
if(route==='home'&&homeState.focus&&home.contains(homeState.focus))homeState.focus.focus({preventScroll:true});else if(!initial)main.focus({preventScroll:true});
if(location.hash==='#contact'){await wait(20);home.querySelector('#contact').scrollIntoView({behavior:reduced()?'instant':'smooth'});}
}
addEventListener('hashchange',()=>render());render(true);
document.addEventListener('click',async e=>{const section=e.target.closest('[data-work-section]');if(section){const target=document.getElementById(section.dataset.workSection);target?.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});if(target){target.tabIndex=-1;target.focus({preventScroll:true});}return;}const top=e.target.closest('.back-top'),brand=e.target.closest('.brand'),contact=e.target.closest('.contact-link'),copy=e.target.closest('[data-copy]');
if(top||(brand&&route==='home')){e.preventDefault();window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});}
if(contact&&route==='home'){e.preventDefault();home.querySelector('#contact').scrollIntoView({behavior:reduced()?'instant':'smooth'});}
if(copy){const status=copy.closest('.contact-details').querySelector('.copy-status');try{await navigator.clipboard.writeText(copy.dataset.copy);status.textContent='已复制微信号';}catch{status.textContent='请手动复制：'+copy.dataset.copy;}}
});
// Preserve browser-native back/forward navigation without its competing scroll restoration.
if('scrollRestoration' in history)history.scrollRestoration='manual';

// Native modal: Escape, explicit close, backdrop click, and focus restoration.
const imageDialog=document.querySelector('#work-image-dialog');
let imageOpener;
document.addEventListener('click',e=>{const preview=e.target.closest('.work-image-preview');if(!preview)return;const img=preview.querySelector('img');if(!img)return;imageOpener=preview;imageDialog.querySelector('.image-dialog-photo').src=img.currentSrc||img.src;imageDialog.querySelector('.image-dialog-photo').alt=img.alt;imageDialog.querySelector('#work-image-caption').textContent=preview.closest('figure').querySelector('figcaption')?.textContent||img.alt;imageDialog.showModal();imageDialog.scrollTop=0;});
imageDialog.querySelector('.image-dialog-close').addEventListener('click',()=>imageDialog.close());
imageDialog.addEventListener('click',e=>{if(e.target!==imageDialog)return;const r=imageDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)imageDialog.close();});
imageDialog.addEventListener('close',()=>imageOpener?.focus({preventScroll:true}));
addEventListener('hashchange',()=>{if(imageDialog.open)imageDialog.close();});

function bindPhotoCarousel(view){
 const track=view.querySelector('.personal-gallery');if(!track)return;
 const cards=[...track.children],controls=view.querySelector('.photo-carousel-controls'),count=controls.querySelector('[data-photo-count]');
 const index=()=>cards.reduce((best,c,i)=>Math.abs(c.offsetLeft-track.offsetLeft-track.scrollLeft)<Math.abs(cards[best].offsetLeft-track.offsetLeft-track.scrollLeft)?i:best,0);
 const update=()=>{const i=index();count.textContent=String(i+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');controls.querySelector('[data-photo-step="-1"]').disabled=i===0;controls.querySelector('[data-photo-step="1"]').disabled=i===cards.length-1;};
 const move=step=>{const i=Math.max(0,Math.min(cards.length-1,index()+step));track.scrollTo({left:cards[i].offsetLeft-track.offsetLeft,behavior:reduced()?'instant':'smooth'});};
 const click=e=>{const b=e.target.closest('[data-photo-step]');if(b)move(Number(b.dataset.photoStep));};
 const key=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}};
 controls.addEventListener('click',click);track.addEventListener('scroll',update,{passive:true});track.addEventListener('keydown',key);requestAnimationFrame(update);
 return()=>{controls.removeEventListener('click',click);track.removeEventListener('scroll',update);track.removeEventListener('keydown',key);};
}
