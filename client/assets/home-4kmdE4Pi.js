import{w as m}from"./with-props-Db1jVSdq.js";import{r as u,l as f}from"./chunk-HA7DTUK3-DItZKCSJ.js";const p=(o,t,n)=>{const e=i(o,t);return d(e,o,t,n),x(e,o,t),e},i=(o,t)=>{const n=[];for(var e=0;e<t;e++){const s=[];for(var r=0;r<o;r++)s.push(0);n.push(s)}return n},d=(o,t,n,e)=>{for(var r=0;r<e;r++){let s=!1;for(;!s;){let a=Math.floor(Math.random()*n),l=Math.floor(Math.random()*t);o[a][l]===0&&(o[a][l]=-1,s=!0)}}},x=(o,t,n)=>{for(var e=0;e<n;e++)for(var r=0;r<t;r++)o[e][r]===0&&(o[e][r]=h(o,t,n,e,r))},c=[-1,0,1],h=(o,t,n,e,r)=>c.map(s=>c.map(a=>e+s>0&&e+s<n&&r+a>0&&r+a<t?o[e+s][r+a]:0).reduce((a,l)=>a+(l===-1?1:0),0)).reduce((s,a)=>s+a,0);function w({}){return[{title:"Minesweeper by Diddy"},{name:"description",content:"This game will make you shit your pants"}]}const y=m(function(){const[t,n]=u.useState();return u.useEffect(()=>{n(p(30,16,99))},[]),f.jsx("div",{className:"flex flex-col w-full h-full items-center justify-center",children:t==null?void 0:t.map(e=>f.jsx("div",{className:"flex flex-row",children:e.map(r=>f.jsx("div",{className:"flex flex-col w-[30px] h-[30px]",children:r}))}))})});export{y as default,w as meta};
