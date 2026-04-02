<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clerestory — Deal Detail</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--sb:#1A2130;--sb-line:rgba(200,220,255,0.07);--sb-line2:rgba(200,220,255,0.13);--sb-text:rgba(245,240,232,0.96);--sb-muted:rgba(240,235,225,0.62);--sb-label:rgba(240,235,225,0.38);--bg:#F4F1EC;--bg2:#EAE6DF;--card:#FFFFFF;--ink:#0F0D09;--ink2:#2C2822;--ink3:#524D46;--ink4:#6E6860;--blue:#4E6E96;--blue2:#6480A2;--blue3:#89A8C6;--blue-bg:rgba(78,110,150,0.09);--blue-bdr:rgba(78,110,150,0.30);--rust:#B83714;--rust-bg:rgba(184,55,20,0.08);--rust-bdr:rgba(184,55,20,0.30);--green:#156636;--green-bg:rgba(21,102,54,0.08);--green-bdr:rgba(21,102,54,0.28);--amber:#8C5A04;--amber-bg:rgba(140,90,4,0.09);--amber-bdr:rgba(140,90,4,0.28);--purple:#5838A0;--purple-bg:rgba(88,56,160,0.08);--purple-bdr:rgba(88,56,160,0.26);--line:rgba(0,0,0,0.08);--line2:rgba(0,0,0,0.055);--line3:rgba(0,0,0,0.034);--shadow:0 1px 4px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.05);--shadow-md:0 4px 16px rgba(0,0,0,0.10);--radius:10px;}
html,body{width:100%;min-height:100vh;background:var(--bg);color:var(--ink);}
body{font-family:'Instrument Sans',sans-serif;font-size:15px;font-weight:400;display:flex;}
.sidebar{width:242px;min-height:100vh;background:linear-gradient(180deg,#1F2840 0%,#1A2130 55%,#15192A 100%);display:flex;flex-direction:column;flex-shrink:0;position:fixed;top:0;left:0;z-index:20;}
.sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#6480A2 35%,#89A8C6 65%,transparent);}
.logo-zone{padding:20px 18px 16px;border-bottom:1px solid var(--sb-line2);display:flex;align-items:center;gap:11px;}
.logo-icon{width:34px;height:34px;border-radius:7px;background:#0D1320;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.logo-name{font-size:15px;font-weight:500;color:var(--sb-text);}
.logo-tag{font-family:'Cormorant Garamond',serif;font-size:12px;font-style:italic;color:rgba(100,128,162,0.72);margin-top:2px;}
.nav-section{padding:10px 0 2px;}
.nav-label{font-family:'Cormorant Garamond',serif;font-size:12px;font-style:italic;color:var(--sb-label);padding:0 16px 5px;}
.nav-item{display:flex;align-items:center;padding:8px 18px;cursor:pointer;border-left:2px solid transparent;font-size:13.5px;color:var(--sb-muted);gap:8px;transition:all 0.12s;}
.nav-item:hover{background:rgba(255,255,255,0.045);}
.nav-item.active{background:rgba(100,128,162,0.16);border-left-color:#89A8C6;color:var(--sb-text);font-weight:500;}
.nav-text{flex:1;}
.nav-ct{font-family:'DM Mono',monospace;font-size:11px;color:rgba(200,215,235,0.38);background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:20px;}
.nav-item.active .nav-ct{color:#89A8C6;background:rgba(100,128,162,0.22);}
.nav-ct.hot{color:#F08880;background:rgba(220,100,88,0.20);}
.nav-divider{height:1px;background:var(--sb-line);margin:5px 16px;}
.sb-footer{margin-top:auto;padding:14px 18px;border-top:1px solid var(--sb-line2);display:flex;align-items:center;gap:10px;}
.avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4E6E96,#6480A2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;}
.f-name{font-size:13px;font-weight:500;color:var(--sb-text);}
.f-role{font-family:'Cormorant Garamond',serif;font-size:12px;font-style:italic;color:rgba(100,128,162,0.65);margin-top:1px;}
.main{flex:1;margin-left:242px;display:flex;flex-direction:column;min-height:100vh;}
.content{flex:1;overflow-y:auto;}
.page-wrap{max-width:1700px;min-width:1100px;margin:0 auto;padding-bottom:60px;}

/* TICKER */
.signal-ticker{background:#0A1018;overflow:hidden;height:38px;display:flex;align-items:center;position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(100,128,162,0.15);}
.ticker-label{font-family:'DM Mono',monospace;font-size:10px;color:var(--blue3);letter-spacing:0.14em;text-transform:uppercase;padding:0 18px;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.07);height:100%;display:flex;align-items:center;gap:8px;background:rgba(100,128,162,0.07);}
.ticker-pulse{width:7px;height:7px;border-radius:50%;background:#4CAF80;box-shadow:0 0 7px #4CAF80;animation:tpulse 1.8s ease-in-out infinite;}
@keyframes tpulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.65);}}
.ticker-track{flex:1;overflow:hidden;}
.ticker-inner{display:flex;white-space:nowrap;animation:ticker-scroll 38s linear infinite;}
@keyframes ticker-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ti{font-family:'DM Mono',monospace;font-size:11px;padding:0 28px;color:rgba(180,200,225,0.46);border-right:1px solid rgba(255,255,255,0.04);line-height:38px;}
.ti .hi{color:#89A8C6;}
.ti .up{color:#4CAF80;}
.ti .dn{color:#E07060;}
.ti .wn{color:#E0A040;}

/* HERO */
.hero{height:295px;position:relative;overflow:hidden;}
#map{width:100%;height:295px;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(3,2,1,0.92) 0%,rgba(3,2,1,0.18) 52%,transparent 100%);pointer-events:none;z-index:400;}
.hero-content{position:absolute;bottom:0;left:0;right:0;z-index:500;padding:24px 32px 22px;}
.hero-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#fff;line-height:1;letter-spacing:-0.01em;margin-bottom:12px;text-shadow:0 2px 14px rgba(0,0,0,0.75);}
.hero-badges{display:flex;gap:7px;flex-wrap:wrap;}
.hb{padding:5px 12px;border-radius:5px;font-size:11.5px;font-weight:500;letter-spacing:0.02em;border:1px solid;backdrop-filter:blur(8px);}
.hb-stage{background:rgba(140,90,4,0.40);border-color:rgba(220,160,50,0.55);color:#FFE0A0;font-weight:700;}
.hb-green{background:rgba(21,102,54,0.38);border-color:rgba(60,180,110,0.52);color:#B8F0D0;}
.hb-blue{background:rgba(78,110,150,0.38);border-color:rgba(137,168,198,0.54);color:#C8E0F8;}
.hb-rust{background:rgba(184,55,20,0.38);border-color:rgba(220,100,60,0.52);color:#FFD0B8;font-weight:700;}
.hero-back{position:absolute;top:16px;right:22px;z-index:500;padding:7px 16px;border-radius:7px;border:1px solid rgba(255,255,255,0.18);background:rgba(0,0,0,0.44);backdrop-filter:blur(10px);color:rgba(255,255,255,0.75);font-size:12px;font-family:'Instrument Sans',sans-serif;cursor:pointer;transition:all 0.12s;}
.hero-back:hover{background:rgba(0,0,0,0.65);color:#fff;}

/* ACTION BAR */
.action-bar{background:var(--bg2);border-bottom:1px solid var(--line);padding:14px 32px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.ab-div{width:1px;height:22px;background:rgba(0,0,0,0.12);margin:0 4px;}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:7px;font-family:'Instrument Sans',sans-serif;font-size:12.5px;font-weight:500;cursor:pointer;border:1px solid;transition:all 0.12s;white-space:nowrap;}
.btn-ghost{background:var(--card);color:var(--ink3);border-color:var(--line);}
.btn-ghost:hover{background:#f0ece4;color:var(--ink2);}
.btn-link{background:none;border:none;color:var(--blue2);font-size:12.5px;padding:6px 10px;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(100,128,162,0.3);font-family:'Instrument Sans',sans-serif;}
.btn-link:hover{color:var(--blue);}
.btn-synth{background:linear-gradient(135deg,rgba(88,56,160,0.12),rgba(88,56,160,0.06));border:1px solid rgba(88,56,160,0.32);color:var(--purple);font-weight:500;}
.btn-synth:hover{background:rgba(88,56,160,0.16);}
.btn-advance{background:linear-gradient(135deg,#2A5C2A,var(--green));color:#fff;border:none;font-weight:600;box-shadow:0 2px 10px rgba(21,102,54,0.30);padding:8px 20px;border-radius:7px;font-family:'Instrument Sans',sans-serif;font-size:13px;cursor:pointer;transition:all 0.12s;}
.btn-advance:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(21,102,54,0.40);}
.ml-auto{margin-left:auto;}

/* PIPELINE STAGE TRACK */
.stage-wrap{background:var(--card);border-bottom:1px solid var(--line);padding:0 32px;}
.stage-track{display:flex;overflow-x:auto;scrollbar-width:none;}
.stage-track::-webkit-scrollbar{display:none;}
.stage-step{position:relative;cursor:pointer;flex-shrink:0;}
.stage-step:not(:last-child)::after{content:'';position:absolute;right:-12px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:12px solid var(--bg2);z-index:2;}
.stage-inner{padding:13px 22px 13px 26px;font-size:12.5px;font-weight:500;color:var(--ink4);white-space:nowrap;display:flex;align-items:center;gap:8px;border-bottom:3px solid transparent;background:transparent;transition:all 0.12s;}
.stage-step:first-child .stage-inner{padding-left:16px;}
.stage-step:hover .stage-inner{color:var(--ink2);background:rgba(0,0,0,0.02);}
.stage-step.done .stage-inner{color:var(--green);}
.stage-step.done::after{border-left-color:rgba(21,102,54,0.06);}
.stage-step.active .stage-inner{color:var(--blue);font-weight:700;background:var(--blue-bg);border-bottom-color:var(--blue);}
.stage-step.active::after{border-left-color:var(--blue-bg);}
.s-check{font-size:11px;}
.s-dot{width:7px;height:7px;border-radius:50%;background:var(--blue);flex-shrink:0;animation:sdot 1.5s ease-in-out infinite;}
@keyframes sdot{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(78,110,150,0.5);}50%{opacity:.6;box-shadow:0 0 0 5px rgba(78,110,150,0);}}

/* INNER */
.inner{padding:22px 32px 0;}

/* KPI STRIP */
.deal-kpis{display:grid;grid-template-columns:repeat(5,1fr);background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--line2);overflow:hidden;margin-bottom:20px;}
.dk{padding:18px 20px;border-right:1px solid var(--line2);position:relative;overflow:hidden;}
.dk:last-child{border-right:none;}
.dk-lbl{font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink4);margin-bottom:7px;}
.dk-val{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--ink);line-height:1;letter-spacing:-0.02em;}
.dk-val.blue{color:var(--blue);}
.dk-val.green{color:var(--green);}
.dk-val.amber{color:var(--amber);}
.dk-sub{font-size:11.5px;color:var(--ink4);margin-top:4px;}
.dk.prob-dk::after{content:'';position:absolute;bottom:0;left:0;height:3px;background:linear-gradient(90deg,var(--blue2),var(--green));animation:pbar 1.7s cubic-bezier(.4,0,.2,1) forwards;}
@keyframes pbar{from{width:0}to{width:81%;}}

/* AI SYNTHESIS */
.synth-card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid rgba(88,56,160,0.18);overflow:hidden;margin-bottom:20px;position:relative;}
.synth-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#8B6FCC,var(--purple));}
.synth-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 12px 22px;border-bottom:1px solid rgba(88,56,160,0.12);cursor:pointer;user-select:none;}
.synth-hdr:hover{background:#FDFCFF;}
.synth-hl{display:flex;align-items:center;gap:8px;}
.synth-title{font-size:11px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:var(--purple);}
.synth-meta{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--ink4);}
.synth-tog{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--purple);}
.synth-inner{padding:20px 24px;}
.ss{margin-bottom:14px;}
.ss:last-child{margin-bottom:0;}
.ss-title{font-size:12.5px;font-weight:600;color:var(--ink2);margin-bottom:7px;display:flex;align-items:center;gap:6px;}
.ss-title::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--purple);flex-shrink:0;}
.si{font-size:13.5px;line-height:1.72;color:var(--ink2);display:flex;gap:8px;margin-bottom:3px;}
.si::before{content:'–';color:var(--ink4);flex-shrink:0;}
.sn{font-size:13.5px;line-height:1.72;color:var(--ink2);display:flex;gap:10px;margin-bottom:4px;}
.sn-num{font-family:'DM Mono',monospace;font-size:11px;color:var(--purple);font-weight:600;flex-shrink:0;min-width:20px;padding-top:2px;}
.sn strong{font-weight:600;color:var(--ink);}
.s-crit{margin-top:14px;padding:11px 15px;background:rgba(184,55,20,0.05);border:1px solid rgba(184,55,20,0.18);border-radius:7px;font-size:13.5px;line-height:1.65;color:var(--ink2);}
.s-crit strong{color:var(--rust);font-weight:600;}
.synth-foot{display:flex;align-items:center;gap:8px;padding:10px 24px;border-top:1px solid rgba(88,56,160,0.10);background:rgba(88,56,160,0.02);}
.synth-regen{font-size:12px;color:var(--purple);cursor:pointer;background:none;border:1px solid rgba(88,56,160,0.22);border-radius:6px;padding:4px 12px;font-family:'Instrument Sans',sans-serif;transition:all 0.1s;}
.synth-regen:hover{background:rgba(88,56,160,0.08);}
.synth-ts{font-family:'DM Mono',monospace;font-size:11px;color:var(--ink4);margin-left:auto;}

/* TABS */
.tabs-nav{display:flex;border-bottom:1px solid var(--line);margin-bottom:20px;}
.tab-item{padding:11px 16px;font-size:13.5px;color:var(--ink4);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;transition:all 0.12s;}
.tab-item:hover{color:var(--ink2);}
.tab-item.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:500;}
.tab-ct{font-family:'DM Mono',monospace;font-size:10px;background:var(--bg2);border:1px solid var(--line);border-radius:20px;padding:1px 7px;margin-left:4px;color:var(--ink4);}

/* BODY COLS */
.body-cols{display:grid;grid-template-columns:1fr 310px;gap:18px;}
.right-col{display:flex;flex-direction:column;gap:14px;}

/* CARD */
.card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--line2);overflow:hidden;}
.card-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--line);}
.card-title{font-size:11px;font-weight:500;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);display:flex;align-items:center;gap:6px;}
.card-action{font-family:'Cormorant Garamond',serif;font-size:13.5px;font-style:italic;color:var(--blue2);cursor:pointer;}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--rust);animation:blink 1.4s infinite;flex-shrink:0;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.1}}

/* LOG BAR */
.log-bar{padding:11px 18px;border-bottom:1px solid var(--line);background:var(--bg);display:flex;gap:7px;align-items:center;}
.log-tabs{display:flex;gap:4px;flex-shrink:0;}
.log-tab{padding:5px 12px;border-radius:6px;border:1px solid var(--line);background:var(--card);font-size:12px;color:var(--ink3);cursor:pointer;font-family:'Instrument Sans',sans-serif;transition:all 0.1s;}
.log-tab:hover{background:var(--bg2);}
.log-tab.active{background:var(--blue);color:#fff;border-color:var(--blue);}
.log-input{flex:1;padding:7px 12px;border:1px solid var(--line);border-radius:6px;font-family:'Instrument Sans',sans-serif;font-size:13px;color:var(--ink2);background:var(--card);outline:none;transition:border 0.12s;}
.log-input:focus{border-color:var(--blue-bdr);box-shadow:0 0 0 3px rgba(78,110,150,0.07);}
.log-btn{padding:7px 16px;background:var(--blue);color:#fff;border:none;border-radius:6px;font-family:'Instrument Sans',sans-serif;font-size:12.5px;font-weight:500;cursor:pointer;}

/* ACT ROWS */
.act-row{display:flex;gap:13px;padding:12px 18px;border-bottom:1px solid var(--line2);transition:background 0.1s;}
.act-row:last-child{border-bottom:none;}
.act-row:hover{background:rgba(78,110,150,0.03);}
.act-icon{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;margin-top:1px;}
.act-icon.call{background:var(--blue-bg);color:var(--blue);}
.act-icon.note{background:var(--amber-bg);color:var(--amber);}
.act-icon.uw{background:var(--purple-bg);color:var(--purple);}
.act-icon.email{background:var(--purple-bg);color:var(--purple);}
.act-icon.meet{background:var(--rust-bg);color:var(--rust);}
.act-body{flex:1;}
.act-text{font-size:13.5px;color:var(--ink2);line-height:1.45;}
.act-text strong{font-weight:500;}
.act-meta{font-family:'Cormorant Garamond',serif;font-size:12px;font-style:italic;color:var(--ink4);margin-top:2px;}
.act-date{font-family:'DM Mono',monospace;font-size:10.5px;color:var(--ink4);flex-shrink:0;padding-top:3px;}
.tl-more{padding:11px 18px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--bg);border-top:1px solid var(--line);transition:background 0.1s;}
.tl-more:hover{background:var(--bg2);}
.tl-more-text{font-family:'Cormorant Garamond',serif;font-size:13.5px;font-style:italic;color:var(--blue2);}

/* DEAL DETAILS HORIZONTAL */
.dd-strip{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--line2);overflow:hidden;margin-top:16px;}
.dd-strip-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid var(--line);background:var(--bg);}
.dd-strip-title{font-size:11px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);}
.dd-strip-edit{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--blue2);cursor:pointer;}
.dd-grid{display:grid;grid-template-columns:repeat(7,1fr);}
.dd-cell{padding:13px 16px;border-right:1px solid var(--line2);}
.dd-cell:last-child{border-right:none;}
.dd-lbl{font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink4);margin-bottom:5px;}
.dd-val{font-size:13.5px;color:var(--ink2);line-height:1.3;}
.dd-val.blue{color:var(--blue);}
.dd-val.amber{color:var(--amber);}
.dd-val.rust{color:var(--rust);font-weight:600;}
.dd-val.green{color:var(--green);}
.dd-val.link{color:var(--blue);cursor:pointer;text-decoration:underline;text-decoration-color:rgba(78,110,150,0.3);}
.dd-val.mono{font-family:'DM Mono',monospace;font-size:13px;}

/* RIGHT: PROB */
.prob-card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--green-bdr);overflow:hidden;}
.prob-body{padding:18px 20px;}
.prob-lbl{font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--green);margin-bottom:8px;}
.prob-num{font-family:'Playfair Display',serif;font-size:56px;font-weight:700;color:var(--green);line-height:1;letter-spacing:-0.03em;}
.prob-track{height:6px;background:var(--bg2);border-radius:3px;overflow:hidden;margin:12px 0 10px;}
.prob-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--blue2),var(--green));width:0;transition:width 1.7s cubic-bezier(.4,0,.2,1);}
.prob-note{font-size:12.5px;color:var(--ink3);line-height:1.58;}

/* DAYS CARD */
.days-card{background:linear-gradient(135deg,rgba(78,110,150,0.08),rgba(78,110,150,0.03));border:1px solid var(--blue-bdr);border-radius:var(--radius);padding:16px 18px;display:flex;align-items:center;gap:16px;}
.days-num{font-family:'Playfair Display',serif;font-size:46px;font-weight:700;color:var(--blue);line-height:1;letter-spacing:-0.03em;flex-shrink:0;}
.days-body .days-lbl{font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--blue2);margin-bottom:4px;}
.days-body .days-note{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--ink3);line-height:1.4;}
.days-urgent{font-family:'DM Mono',monospace;font-size:10px;color:var(--rust);background:var(--rust-bg);padding:2px 8px;border-radius:3px;margin-top:5px;display:inline-block;}

/* AI NEXT */
.ai-next-card{background:rgba(88,56,160,0.04);border:1px solid rgba(88,56,160,0.18);border-radius:var(--radius);overflow:hidden;}
.ai-next-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(88,56,160,0.12);}
.ai-next-title{font-size:10.5px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--purple);display:flex;align-items:center;gap:6px;}
.ai-next-refresh{font-family:'Instrument Sans',sans-serif;font-size:12px;color:var(--purple);cursor:pointer;background:none;border:1px solid rgba(88,56,160,0.22);border-radius:5px;padding:3px 10px;transition:all 0.1s;}
.ai-next-refresh:hover{background:rgba(88,56,160,0.08);}
.ai-next-body{padding:13px 14px;font-family:'Cormorant Garamond',serif;font-size:14.5px;font-style:italic;line-height:1.65;color:var(--ink3);transition:opacity 0.25s;}

/* MEMO */
.memo-card{background:var(--blue-bg);border:1px solid var(--blue-bdr);border-radius:var(--radius);overflow:hidden;}
.memo-hdr{padding:10px 16px;background:rgba(78,110,150,0.12);border-bottom:1px solid var(--blue-bdr);font-size:11px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--blue);}
.memo-body{padding:13px 16px;font-size:13.5px;line-height:1.75;color:var(--ink2);}
.memo-body strong{color:var(--blue);font-weight:500;}

/* VELOCITY */
.velocity-card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--line2);overflow:hidden;}
.vel-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--line);background:var(--bg);}
.vel-title{font-size:11px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);}
.vel-status{font-family:'DM Mono',monospace;font-size:10px;color:var(--green);}
.vel-body{padding:14px 16px;}
.vel-row{margin-bottom:10px;}
.vel-lbl-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.vel-lbl{font-size:11px;color:var(--ink4);}
.vel-pct{font-family:'DM Mono',monospace;font-size:10.5px;font-weight:500;}
.vel-bar-wrap{height:5px;background:var(--bg2);border-radius:3px;overflow:hidden;}
.vel-bar{height:100%;border-radius:3px;transition:width 1.5s cubic-bezier(.4,0,.2,1);width:0;}
.vel-bar.b-deal{background:linear-gradient(90deg,var(--blue),var(--blue3));}
.vel-bar.b-stage{background:linear-gradient(90deg,var(--amber),#D4A040);}
.vel-bar.b-owner{background:linear-gradient(90deg,var(--green),#4CAF80);}
.vel-stats{display:flex;gap:0;border-top:1px solid var(--line2);margin-top:4px;}
.vel-stat{flex:1;padding:8px 10px;border-right:1px solid var(--line2);text-align:center;}
.vel-stat:last-child{border-right:none;}
.vel-stat-num{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--ink2);}
.vel-stat-lbl{font-size:10px;color:var(--ink4);margin-top:1px;}

/* CATALYSTS */
.cat-card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--line2);overflow:hidden;}
.cat-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--line);background:var(--bg);}
.cat-hdr-title{font-size:11px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);}
.cat-add{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--blue2);cursor:pointer;}
.cat-row{display:flex;align-items:center;gap:9px;padding:9px 16px;border-bottom:1px solid var(--line2);cursor:pointer;transition:background 0.1s;}
.cat-row:last-child{border-bottom:none;}
.cat-row:hover{background:rgba(78,110,150,0.03);}
.cat-tag{display:inline-flex;padding:3px 9px;border-radius:4px;font-size:10.5px;font-weight:600;flex-shrink:0;}
.c-loi{background:rgba(140,90,4,0.10);border:1px solid var(--amber-bdr);color:var(--amber);}
.c-urgent{background:var(--rust-bg);border:1px solid var(--rust-bdr);color:var(--rust);}
.c-slb{background:var(--green-bg);border:1px solid var(--green-bdr);color:var(--green);}
.c-hire{background:var(--blue-bg);border:1px solid var(--blue-bdr);color:var(--blue);}
.c-lease{background:rgba(140,90,4,0.08);border:1px solid var(--amber-bdr);color:var(--amber);}
.cat-desc{font-size:12.5px;color:var(--ink3);flex:1;line-height:1.3;}
.cat-meta{font-family:'DM Mono',monospace;font-size:10px;color:var(--ink4);white-space:nowrap;}
.cat-auto{font-family:'DM Mono',monospace;font-size:10px;color:var(--green);background:var(--green-bg);padding:1px 6px;border-radius:3px;white-space:nowrap;}

/* SP ROWS */
.sp-hdr{padding:10px 18px;border-bottom:1px solid var(--line);font-size:11px;font-weight:500;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);display:flex;align-items:center;justify-content:space-between;}
.sp-hdr-a{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--blue2);cursor:pointer;font-weight:400;letter-spacing:0;text-transform:none;}
.sp-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 18px;border-bottom:1px solid var(--line2);}
.sp-row:last-child{border-bottom:none;}
.sp-key{font-size:12.5px;color:var(--ink4);}
.sp-val{font-size:13px;color:var(--ink2);text-align:right;max-width:180px;}
.sp-val.blue{color:var(--blue);}
.sp-val.amber{color:var(--amber);}
.sp-val.link{color:var(--blue);cursor:pointer;text-decoration:underline;text-decoration-color:rgba(78,110,150,0.35);}

/* BUYER */
.buyer-row{display:flex;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid var(--line2);cursor:pointer;transition:background 0.1s;}
.buyer-row:last-child{border-bottom:none;}
.buyer-row:hover{background:rgba(78,110,150,0.03);}
.buyer-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--blue-bg),rgba(78,110,150,0.18));border:1px solid var(--blue-bdr);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--blue);flex-shrink:0;}
.buyer-name{font-size:13px;font-weight:500;color:var(--ink2);flex:1;}
.buyer-sub{font-size:11.5px;color:var(--ink4);}
.buyer-match{font-family:'DM Mono',monospace;font-size:10.5px;padding:2px 8px;border-radius:3px;flex-shrink:0;}
.buyer-match.high{background:var(--green-bg);color:var(--green);}
.buyer-match.med{background:var(--blue-bg);color:var(--blue);}

/* PROP MINI */
.prop-mini{padding:16px 18px;}
.prop-mini-addr{font-size:14px;font-weight:500;color:var(--ink2);margin-bottom:2px;}
.prop-mini-sub{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--ink4);margin-bottom:12px;}
.prop-spec-strip{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line2);border-radius:7px;overflow:hidden;margin-bottom:7px;}
.pss-cell{padding:9px 10px;border-right:1px solid var(--line2);text-align:center;}
.pss-cell:last-child{border-right:none;}
.pss-lbl{font-size:9.5px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink4);margin-bottom:3px;}
.pss-val{font-family:'DM Mono',monospace;font-size:12.5px;color:var(--ink2);}
.pss-val.hi{color:var(--blue);}
.prop-mini-footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;}
.prop-mini-link{font-family:'Cormorant Garamond',serif;font-size:13.5px;font-style:italic;color:var(--blue2);cursor:pointer;text-decoration:underline;text-decoration-color:rgba(100,128,162,0.35);}

/* UW */
#uw-tab{display:none;}
.uw-form-card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--blue-bdr);overflow:hidden;margin-bottom:16px;position:relative;}
.uw-form-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--blue2);}
.uw-form-hdr{padding:12px 18px 12px 22px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;}
.uw-form-title{font-size:13.5px;font-weight:500;color:var(--ink2);}
.uw-form-sub{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--ink4);}
.uw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px 22px;}
.uw-field label{font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);display:block;margin-bottom:5px;}
.uw-field input{width:100%;padding:8px 11px;border:1px solid var(--line);border-radius:7px;font-family:'Instrument Sans',sans-serif;font-size:14px;color:var(--ink2);background:var(--bg);outline:none;}
.uw-field input:focus{border-color:var(--blue-bdr);box-shadow:0 0 0 3px rgba(78,110,150,0.08);}
.uw-note-sm{font-size:12px;color:var(--ink4);font-family:'Cormorant Garamond',serif;font-style:italic;margin-top:3px;}
.uw-results{display:grid;grid-template-columns:repeat(4,1fr);background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.uw-metric{padding:14px 16px;border-right:1px solid var(--line);}
.uw-metric:last-child{border-right:none;}
.uw-metric label{font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink4);display:block;margin-bottom:6px;}
.uw-val{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;line-height:1;transition:opacity 0.4s;}
.uw-val.good{color:var(--green);}
.uw-val.ok{color:var(--blue);}
.uw-val.warn{color:var(--amber);}
.uw-actions{padding:12px 22px;display:flex;align-items:center;gap:8px;}
.uw-run{padding:9px 20px;background:var(--blue);color:#fff;border:none;border-radius:7px;font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;}
.uw-excel{padding:9px 16px;background:var(--green-bg);color:var(--green);border:1px solid var(--green-bdr);border-radius:7px;font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;}
.uw-note-full{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--ink4);margin-left:auto;}
.uw-toggle-row{display:flex;gap:8px;margin-bottom:14px;}
.uw-toggle-btn{padding:8px 18px;border-radius:7px;border:1px solid var(--line);background:var(--card);color:var(--ink3);font-family:'Instrument Sans',sans-serif;font-size:13px;cursor:pointer;}
.uw-toggle-btn.active{background:var(--blue);color:#fff;border-color:var(--blue);}
.returns-dash{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--line2);overflow:hidden;margin-bottom:16px;}
.rd-hdr{padding:12px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;}
.rd-title{font-size:11px;font-weight:500;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink3);}
.rd-grid{display:grid;grid-template-columns:repeat(4,1fr);}
.rd-cell{padding:16px 18px;border-right:1px solid var(--line2);text-align:center;}
.rd-cell:last-child{border-right:none;}
.rd-lbl{font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:var(--ink4);margin-bottom:8px;}
.rd-val{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;line-height:1;}
.rd-val.green{color:var(--green);}
.rd-val.blue{color:var(--blue);}
.rd-sub{font-size:12px;color:var(--ink4);margin-top:4px;}
.sens-grid-wrap{padding:16px 18px;}
.sens-table{width:100%;border-collapse:collapse;font-family:'DM Mono',monospace;font-size:12px;}
.sens-table th{padding:7px 10px;background:var(--bg2);border:1px solid var(--line);font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink3);}
.sens-table td{padding:7px 10px;border:1px solid var(--line2);text-align:center;color:var(--ink2);}
.sens-table td.good{background:rgba(21,102,54,0.08);color:var(--green);font-weight:500;}
.sens-table td.ok{background:rgba(78,110,150,0.07);color:var(--blue);}
.sens-table td.warn{background:rgba(140,90,4,0.07);color:var(--amber);}
.sens-table td.base{background:rgba(78,110,150,0.12);font-weight:700;color:var(--blue);}

@keyframes fade-up{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.inner>*{animation:fade-up 0.35s ease both;}
.inner>*:nth-child(1){animation-delay:.04s;}
.inner>*:nth-child(2){animation-delay:.10s;}
.inner>*:nth-child(3){animation-delay:.16s;}
.inner>*:nth-child(4){animation-delay:.22s;}
@keyframes row-in{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:translateX(0);}}
</style></head>
<body>

<aside class="sidebar">
  <div class="logo-zone">
    <div class="logo-icon"><svg width="18" height="18" viewBox="0 0 64 64" fill="none"><rect x="4" y="3" width="12" height="9" rx="0.5" fill="#6B83A6"/><rect x="19" y="3" width="12" height="9" rx="0.5" fill="#6B83A6" opacity="0.7"/><rect x="34" y="3" width="12" height="9" rx="0.5" fill="#6B83A6" opacity="0.4"/><line x1="10" y1="18" x2="10" y2="58" stroke="#6B83A6" stroke-width="0.8"/><line x1="25" y1="18" x2="25" y2="58" stroke="#6B83A6" stroke-width="0.8" opacity="0.6"/><line x1="40" y1="18" x2="40" y2="58" stroke="#6B83A6" stroke-width="0.8" opacity="0.3"/><line x1="4" y1="38" x2="50" y2="38" stroke="#6B83A6" stroke-width="0.6" opacity="0.4"/></svg></div>
    <div><div class="logo-name">Clerestory</div><div class="logo-tag">See the deal before it's a deal.</div></div>
  </div>
  <nav>
    <div class="nav-section"><div class="nav-label">Overview</div><div class="nav-item"><span class="nav-text">Command Center</span></div></div>
    <div class="nav-section"><div class="nav-label">CRM</div>
      <div class="nav-item"><span class="nav-text">Properties</span><span class="nav-ct">18</span></div>
      <div class="nav-item"><span class="nav-text">Lead Gen</span><span class="nav-ct">237</span></div>
      <div class="nav-item active"><span class="nav-text">Deal Pipeline</span><span class="nav-ct">12</span></div>
      <div class="nav-item"><span class="nav-text">Contacts</span><span class="nav-ct">94</span></div>
      <div class="nav-item"><span class="nav-text">Accounts</span><span class="nav-ct">68</span></div>
      <div class="nav-item"><span class="nav-text">Tasks</span><span class="nav-ct hot">26</span></div>
    </div>
    <div class="nav-divider"></div>
    <div class="nav-section"><div class="nav-label">Comps</div>
      <div class="nav-item"><span class="nav-text">Lease Comps</span><span class="nav-ct">175</span></div>
      <div class="nav-item"><span class="nav-text">Sale Comps</span><span class="nav-ct">22</span></div>
    </div>
    <div class="nav-divider"></div>
    <div class="nav-section"><div class="nav-label">Intelligence</div>
      <div class="nav-item"><span class="nav-text">WARN Intel</span><span class="nav-ct hot">4</span></div>
      <div class="nav-item"><span class="nav-text">News Feed</span></div>
      <div class="nav-item"><span class="nav-text">Research Campaigns</span></div>
      <div class="nav-item"><span class="nav-text">Owner Search</span></div>
    </div>
  </nav>
  <div class="sb-footer"><div class="avatar">BC</div><div><div class="f-name">Briana Corso</div><div class="f-role">Industrial · SGV / IE</div></div></div>
</aside>

<main class="main"><div class="content"><div class="page-wrap">

  <!-- TICKER STICKY NO WHITE BAR -->
  <div class="signal-ticker">
    <span class="ticker-label"><span class="ticker-pulse"></span>Live Signals</span>
    <div class="ticker-track">
      <div class="ticker-inner">
        <span class="ti">LOI Counter <span class="hi">$46M</span> received Mar 22 · spread <span class="up">+$1.5M</span></span>
        <span class="ti">SGV Cap Rates <span class="hi">5.1–5.4%</span> · Q1 2026</span>
        <span class="ti">Pacific Mfg WARN Activity <span class="up">No filings</span></span>
        <span class="ti">Owner hold period <span class="hi">31 yrs</span> · Unencumbered confirmed</span>
        <span class="ti">Comp Sale: 4444 Workman Mill Rd <span class="hi">$158/SF</span> · Jan 2026</span>
        <span class="ti">Adjacent parcel loan maturity <span class="wn">Dec 2026</span> · urgency</span>
        <span class="ti">Buyer Interest: <span class="hi">8 matched</span> · Blackstone 94% · Prologis 89%</span>
        <span class="ti">Days in LOI stage: <span class="wn">14 days</span> · avg 22d to close</span>
        <span class="ti">LOI Counter <span class="hi">$46M</span> received Mar 22 · spread <span class="up">+$1.5M</span></span>
        <span class="ti">SGV Cap Rates <span class="hi">5.1–5.4%</span> · Q1 2026</span>
        <span class="ti">Pacific Mfg WARN Activity <span class="up">No filings</span></span>
        <span class="ti">Owner hold period <span class="hi">31 yrs</span> · Unencumbered confirmed</span>
        <span class="ti">Comp Sale: 4444 Workman Mill Rd <span class="hi">$158/SF</span> · Jan 2026</span>
        <span class="ti">Adjacent parcel loan maturity <span class="wn">Dec 2026</span> · urgency</span>
        <span class="ti">Buyer Interest: <span class="hi">8 matched</span> · Blackstone 94% · Prologis 89%</span>
        <span class="ti">Days in LOI stage: <span class="wn">14 days</span> · avg 22d to close</span>
      </div>
    </div>
  </div>

  <!-- HERO -->
  <div class="hero">
    <div id="map"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-title">Pacific Manufacturing · 4900 Workman Mill Rd</div>
      <div class="hero-badges">
        <span class="hb hb-stage">LOI Stage</span>
        <span class="hb hb-green">81% Close Probability</span>
        <span class="hb hb-blue">SLB · $47.5M</span>
        <span class="hb hb-blue">312K SF · SGV</span>
        <span class="hb hb-rust">High Priority</span>
      </div>
    </div>
    <button class="hero-back">← Pipeline</button>
  </div>

  <!-- ACTION BAR (no Log Call etc) -->
  <div class="action-bar">
    <button class="btn btn-synth">✦ Synthesize</button>
    <button class="btn btn-ghost">📊 Run Comps</button>
    <button class="btn btn-ghost">↓ Export Memo</button>
    <button class="btn btn-ghost">↓ Export BOV</button>
    <div class="ab-div"></div>
    <button class="btn-link">📍 Google Maps</button>
    <button class="btn-link">🗺 LA County GIS</button>
    <button class="btn-link">🏢 CoStar</button>
    <button class="btn-link">🔍 LoopNet</button>
    <div class="ml-auto"></div>
    <button class="btn-advance">Advance to LOI Accepted →</button>
  </div>

  <!-- PIPELINE STAGES — arrow style -->
  <div class="stage-wrap">
    <div class="stage-track">
      <div class="stage-step done"><div class="stage-inner"><span class="s-check">✓</span>Tracking</div></div>
      <div class="stage-step done"><div class="stage-inner"><span class="s-check">✓</span>Underwriting</div></div>
      <div class="stage-step done"><div class="stage-inner"><span class="s-check">✓</span>Off-Market Outreach</div></div>
      <div class="stage-step done"><div class="stage-inner"><span class="s-check">✓</span>Marketing</div></div>
      <div class="stage-step active"><div class="stage-inner"><span class="s-dot"></span>LOI</div></div>
      <div class="stage-step"><div class="stage-inner">LOI Accepted</div></div>
      <div class="stage-step"><div class="stage-inner">PSA Negotiation</div></div>
      <div class="stage-step"><div class="stage-inner">Due Diligence</div></div>
      <div class="stage-step"><div class="stage-inner">Non-Contingent</div></div>
      <div class="stage-step"><div class="stage-inner">Closed Won</div></div>
    </div>
  </div>

  <!-- INNER -->
  <div class="inner">

    <!-- KPI STRIP -->
    <div class="deal-kpis">
      <div class="dk"><div class="dk-lbl">Deal Value</div><div class="dk-val">$47.5M</div><div class="dk-sub">SLB structure</div></div>
      <div class="dk"><div class="dk-lbl">Commission Est.</div><div class="dk-val green">$570K</div><div class="dk-sub">1.2% both sides</div></div>
      <div class="dk prob-dk"><div class="dk-lbl">Close Probability</div><div class="dk-val blue">81%</div><div class="dk-sub">Updated Mar 22</div></div>
      <div class="dk"><div class="dk-lbl">Deal Type</div><div class="dk-val" style="font-size:17px;font-weight:500;color:var(--ink3);padding-top:4px;">Sale-Leaseback</div><div class="dk-sub">Owner-user seller</div></div>
      <div class="dk"><div class="dk-lbl">Target Close</div><div class="dk-val amber" style="font-size:22px;">Jun 2026</div><div class="dk-sub">~90 days out</div></div>
    </div>

    <!-- AI SYNTHESIS -->
    <div class="synth-card">
      <div class="synth-hdr" onclick="toggleSynth()">
        <div class="synth-hl"><span style="font-size:14px;color:var(--purple);">✦</span><span class="synth-title">AI Synthesis</span><span class="synth-meta">Deal Status Report · Pacific Mfg · 4900 Workman Mill Rd</span></div>
        <span class="synth-tog" id="synth-toggle">Hide ▴</span>
      </div>
      <div id="synth-body">
        <div class="synth-inner">
          <div class="ss"><div class="ss-title">Current Deal Status</div>
            <div class="si">312,000 SF dock-high SLB — LOI submitted at $47.5M, counter at $46M. Spread is $1.5M; recommend accepting to push to PSA before Dec 2026 deadline.</div>
            <div class="si">Owner (RJ Neu Properties) confirmed unencumbered title, off-market preference — exclusive window is intact. 31-year hold creates strong equity-unlock motivation.</div>
            <div class="si">Pacific Mfg as leaseback tenant — 12-year term, 3% annual bumps, market rent $0.98/SF NNN. Going-in cap 4.87%, unlevered IRR 12.4%.</div>
          </div>
          <div class="ss"><div class="ss-title">Key Contacts / Decision Makers</div>
            <div class="si">James Okura (EVP Operations) — primary LOI counterpart, warm engagement, responded within 48h</div>
            <div class="si">RJ Neu (Owner) — motivated by expansion capex needs, wants long-term stay in building</div>
          </div>
          <div class="ss"><div class="ss-title">Recommended Next Steps</div>
            <div class="sn"><span class="sn-num">1.</span><span><strong>Immediate:</strong> Accept $46M counter — communicate to buyer group by Apr 4, advance to PSA.</span></div>
            <div class="sn"><span class="sn-num">2.</span><span><strong>Week 1:</strong> Engage title company to confirm unencumbered status and clear easements.</span></div>
            <div class="sn"><span class="sn-num">3.</span><span><strong>Week 2:</strong> Circulate updated $46M model to institutional buyer group; confirm lease structure with counsel.</span></div>
          </div>
          <div class="s-crit"><strong>Critical Window:</strong> Dec 2026 adjacent parcel maturity is a hard deadline. If PSA not executed by Jun, owner may pivot to refi or portfolio disposition. Push now.</div>
        </div>
        <div class="synth-foot">
          <button class="synth-regen">↺ Regenerate</button>
          <button class="synth-regen" style="margin-left:4px;">⎘ Copy</button>
          <span class="synth-ts">Generated Apr 1, 2026 · 9:14 AM</span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs-nav">
      <div class="tab-item active" onclick="showTab('timeline')">Timeline <span class="tab-ct">14</span></div>
      <div class="tab-item" onclick="showTab('uw')">Underwriting</div>
      <div class="tab-item" onclick="showTab('property')">Property <span class="tab-ct">1</span></div>
      <div class="tab-item" onclick="showTab('contacts')">Contacts <span class="tab-ct">3</span></div>
      <div class="tab-item" onclick="showTab('buyers')">Buyer Outreach <span class="tab-ct">8</span></div>
      <div class="tab-item" onclick="showTab('files')">Files <span class="tab-ct">5</span></div>
    </div>

    <!-- TIMELINE TAB -->
    <div id="timeline-tab">
      <div class="body-cols">
        <div>
          <div class="card">
            <div class="card-hdr"><div class="card-title"><span class="live-dot"></span>Activity Timeline</div><span class="card-action">+ Log Activity</span></div>
            <div class="log-bar">
              <div class="log-tabs">
                <button class="log-tab active" onclick="setLT(this,'call')">📞 Call</button>
                <button class="log-tab" onclick="setLT(this,'email')">✉ Email</button>
                <button class="log-tab" onclick="setLT(this,'note')">📝 Note</button>
                <button class="log-tab" onclick="setLT(this,'meet')">🤝 Meeting</button>
              </div>
              <input class="log-input" id="log-input" placeholder="Log a call..."/>
              <button class="log-btn" onclick="logEntry()">Log</button>
            </div>
            <div id="act-list">
              <div class="act-row"><div class="act-icon call">📞</div><div class="act-body"><div class="act-text"><strong>Called James Okura (EVP Ops)</strong> — LOI counter received. $46M vs our $47.5M ask. Recommending client accept counter to push to PSA.</div><div class="act-meta">Briana Corso · 18 min call</div></div><div class="act-date">Mar 22</div></div>
              <div class="act-row"><div class="act-icon uw">◈</div><div class="act-body"><div class="act-text"><strong>LOI Submitted</strong> — $47.5M · 12-year leaseback · 3% annual bumps · Pacific Mfg as tenant. Sent to owner counsel.</div><div class="act-meta">Briana Corso</div></div><div class="act-date">Mar 18</div></div>
              <div class="act-row"><div class="act-icon uw">📊</div><div class="act-body"><div class="act-text"><strong>Underwriting completed</strong> — Going-in cap 4.87%, unlevered IRR 12.4%, levered IRR 18.6%, equity multiple 2.1×. Model v3 sent to buyer group.</div><div class="act-meta">Briana Corso · Excel model v3</div></div><div class="act-date">Mar 14</div></div>
              <div class="act-row"><div class="act-icon email">✉</div><div class="act-body"><div class="act-text"><strong>Sent SLB overview deck</strong> — cap rate comps and investor demand summary attached. Circulated to 3 institutional buyers.</div><div class="act-meta">Briana Corso · Via email</div></div><div class="act-date">Mar 12</div></div>
              <div class="act-row"><div class="act-icon call">📞</div><div class="act-body"><div class="act-text"><strong>Called RJ Neu (owner)</strong> — Confirmed unencumbered asset, off-market preference, motivated by expansion capex needs. SLB structure receptive.</div><div class="act-meta">Briana Corso · 22 min</div></div><div class="act-date">Mar 10</div></div>
            </div>
            <div class="tl-more"><span class="tl-more-text">View all 14 activities →</span></div>
          </div>

          <!-- DEAL DETAILS HORIZONTAL STRIP -->
          <div class="dd-strip">
            <div class="dd-strip-hdr"><span class="dd-strip-title">Deal Details</span><span class="dd-strip-edit">Edit</span></div>
            <div class="dd-grid">
              <div class="dd-cell"><div class="dd-lbl">Deal Type</div><div class="dd-val">Sale-Leaseback</div></div>
              <div class="dd-cell"><div class="dd-lbl">Stage</div><div class="dd-val blue">LOI</div></div>
              <div class="dd-cell"><div class="dd-lbl">Priority</div><div class="dd-val rust">High</div></div>
              <div class="dd-cell"><div class="dd-lbl">Seller</div><div class="dd-val link">RJ Neu Properties</div></div>
              <div class="dd-cell"><div class="dd-lbl">Tenant</div><div class="dd-val">Pacific Manufacturing</div></div>
              <div class="dd-cell"><div class="dd-lbl">Market</div><div class="dd-val">SGV · Industry/Whittier</div></div>
              <div class="dd-cell"><div class="dd-lbl">Close Date</div><div class="dd-val amber">Jun 2026</div></div>
            </div>
            <div class="dd-grid" style="border-top:1px solid var(--line2);">
              <div class="dd-cell"><div class="dd-lbl">Building SF</div><div class="dd-val mono">312,000 SF</div></div>
              <div class="dd-cell"><div class="dd-lbl">Clear Height</div><div class="dd-val mono">32 ft</div></div>
              <div class="dd-cell"><div class="dd-lbl">Year Built</div><div class="dd-val mono">1998</div></div>
              <div class="dd-cell"><div class="dd-lbl">Lease Term</div><div class="dd-val mono">12-year initial</div></div>
              <div class="dd-cell"><div class="dd-lbl">Rent Bumps</div><div class="dd-val mono">3% annual</div></div>
              <div class="dd-cell"><div class="dd-lbl">Commission</div><div class="dd-val green">$570K est.</div></div>
              <div class="dd-cell"><div class="dd-lbl">$/SF</div><div class="dd-val mono">$152/SF</div></div>
            </div>
          </div>
        </div>

        <!-- RIGHT COL -->
        <div class="right-col">
          <div class="prob-card">
            <div class="prob-body">
              <div class="prob-lbl">Close Probability</div>
              <div class="prob-num">81%</div>
              <div class="prob-track"><div class="prob-fill" id="prob-fill"></div></div>
              <div class="prob-note">LOI submitted, counter at $46M. Owner motivated, asset unencumbered. 14 days in LOI — push to PSA.</div>
            </div>
          </div>

          <div class="days-card">
            <div class="days-num">14</div>
            <div class="days-body">
              <div class="days-lbl">Days in LOI Stage</div>
              <div class="days-note">Avg deal closes LOI in 22 days.<br>8 days remaining in typical window.</div>
              <span class="days-urgent">Act by Apr 8 →</span>
            </div>
          </div>

          <div class="ai-next-card">
            <div class="ai-next-hdr">
              <div class="ai-next-title"><span style="font-size:12px;">✦</span>AI Next Step</div>
              <button class="ai-next-refresh" onclick="refreshNext()">Refresh</button>
            </div>
            <div class="ai-next-body" id="ai-next-body">Accept $46M counter — communicate to buyer group by Apr 4 and advance to PSA stage while Dec 2026 urgency window is intact.</div>
          </div>

          <div class="memo-card">
            <div class="memo-hdr">Opportunity Memo</div>
            <div class="memo-body">Owner-user exploring liquidity via <strong>sale-leaseback</strong> — Pacific Mfg would lease back at market. <strong>Unencumbered asset</strong>, off-market creates exclusive window. Dec 2026 loan maturity on adjacent parcel creates urgency.</div>
          </div>

          <div class="velocity-card">
            <div class="vel-hdr"><span class="vel-title">Deal Velocity</span><span class="vel-status">● On track</span></div>
            <div class="vel-body">
              <div class="vel-row"><div class="vel-lbl-row"><span class="vel-lbl">Deal Health</span><span class="vel-pct" style="color:var(--blue);">87%</span></div><div class="vel-bar-wrap"><div class="vel-bar b-deal" id="vb-deal"></div></div></div>
              <div class="vel-row"><div class="vel-lbl-row"><span class="vel-lbl">Stage Progress</span><span class="vel-pct" style="color:var(--amber);">64%</span></div><div class="vel-bar-wrap"><div class="vel-bar b-stage" id="vb-stage"></div></div></div>
              <div class="vel-row" style="margin-bottom:0"><div class="vel-lbl-row"><span class="vel-lbl">Owner Engagement</span><span class="vel-pct" style="color:var(--green);">92%</span></div><div class="vel-bar-wrap"><div class="vel-bar b-owner" id="vb-owner"></div></div></div>
              <div class="vel-stats">
                <div class="vel-stat"><div class="vel-stat-num">6</div><div class="vel-stat-lbl">Touchpoints</div></div>
                <div class="vel-stat"><div class="vel-stat-num">3</div><div class="vel-stat-lbl">Buyers Active</div></div>
                <div class="vel-stat"><div class="vel-stat-num">14d</div><div class="vel-stat-lbl">In Stage</div></div>
              </div>
            </div>
          </div>

          <div class="cat-card">
            <div class="cat-hdr"><span class="cat-hdr-title">Active Catalysts</span><span class="cat-add">+ Add</span></div>
            <div class="cat-row"><span class="cat-tag c-loi">LOI Counter</span><div class="cat-desc">$46M counter · spread $1.5M</div><span class="cat-meta">Mar 22</span></div>
            <div class="cat-row"><span class="cat-tag c-urgent">Loan Maturity</span><div class="cat-desc">Adjacent parcel Dec 2026</div><span class="cat-auto">auto</span></div>
            <div class="cat-row"><span class="cat-tag c-slb">SLB Receptive</span><div class="cat-desc">Owner confirmed per call</div><span class="cat-meta">Mar 10</span></div>
            <div class="cat-row"><span class="cat-tag c-hire">Hiring Signal</span><div class="cat-desc">+12 hires in 90 days</div><span class="cat-meta">Mar 18</span></div>
            <div class="cat-row"><span class="cat-tag c-lease">Lease '27</span><div class="cat-desc">17 months remaining</div><span class="cat-auto">auto</span></div>
          </div>
        </div>
      </div>
    </div><!-- /timeline-tab -->

    <!-- UW TAB -->
    <div id="uw-tab" style="display:none;">
      <div class="uw-toggle-row">
        <button class="uw-toggle-btn active" onclick="setUWView('quick')">Quick Underwrite</button>
        <button class="uw-toggle-btn" onclick="setUWView('dashboard')">Returns Dashboard</button>
      </div>
      <div id="uw-quick">
        <div class="uw-form-card">
          <div class="uw-form-hdr"><div class="uw-form-title">Quick Underwrite — 5-Year Hold Model</div><div class="uw-form-sub">Values auto-populated from linked property · adjust and run</div></div>
          <div class="uw-grid">
            <div class="uw-field"><label>Asking Price</label><input type="text" value="$47,500,000"><div class="uw-note-sm">~$152/SF on 312K SF</div></div>
            <div class="uw-field"><label>In-Place Rent (NNN/SF/mo)</label><input type="text" value="$0.82"><div class="uw-note-sm">From property record</div></div>
            <div class="uw-field"><label>Market Rent (NNN/SF/mo)</label><input type="text" value="$0.98"><div class="uw-note-sm">SGV comp range</div></div>
            <div class="uw-field"><label>SLB Lease Term (years)</label><input type="text" value="12"></div>
            <div class="uw-field"><label>Annual Rent Bumps</label><input type="text" value="3.0%"></div>
            <div class="uw-field"><label>Cap Rate Exit</label><input type="text" value="5.25%"></div>
            <div class="uw-field"><label>LTV</label><input type="text" value="65%"></div>
            <div class="uw-field"><label>Interest Rate</label><input type="text" value="6.50%"></div>
            <div class="uw-field"><label>Hold Period (years)</label><input type="text" value="5"></div>
          </div>
          <div class="uw-results">
            <div class="uw-metric"><label>Going-In Cap</label><div class="uw-val ok">4.87%</div></div>
            <div class="uw-metric"><label>Unlevered IRR</label><div class="uw-val good">12.4%</div></div>
            <div class="uw-metric"><label>Levered IRR</label><div class="uw-val good">18.6%</div></div>
            <div class="uw-metric"><label>Equity Multiple</label><div class="uw-val good">2.1×</div></div>
          </div>
          <div class="uw-actions">
            <button class="uw-run" onclick="runUW()">▶ Run / Update</button>
            <button class="uw-excel">↓ Export Full Excel Model</button>
            <span class="uw-note-full">Last run Mar 14 · v3 · 5-yr hold</span>
          </div>
        </div>
      </div>
      <div id="uw-dashboard" style="display:none;">
        <div class="returns-dash">
          <div class="rd-hdr"><span class="rd-title">Returns Summary — 5-Year Hold</span><button class="btn btn-ghost" style="font-size:12px;padding:5px 12px;">↓ Export Excel</button></div>
          <div class="rd-grid">
            <div class="rd-cell"><div class="rd-lbl">Unlevered IRR</div><div class="rd-val green">12.4%</div><div class="rd-sub">Exceeds 10% hurdle</div></div>
            <div class="rd-cell"><div class="rd-lbl">Levered IRR</div><div class="rd-val green">18.6%</div><div class="rd-sub">65% LTV · 6.5% rate</div></div>
            <div class="rd-cell"><div class="rd-lbl">Equity Multiple</div><div class="rd-val blue">2.1×</div><div class="rd-sub">$10.7M equity in</div></div>
            <div class="rd-cell"><div class="rd-lbl">DSCR Year 1</div><div class="rd-val blue">1.42×</div><div class="rd-sub">Min 1.20× required</div></div>
          </div>
        </div>
        <div class="returns-dash">
          <div class="rd-hdr"><span class="rd-title">IRR Sensitivity — Exit Cap Rate vs. Rent Growth</span></div>
          <div class="sens-grid-wrap">
            <table class="sens-table">
              <thead><tr><th>Exit Cap \ Rent Growth</th><th>2.0%</th><th>2.5%</th><th>3.0% (base)</th><th>3.5%</th><th>4.0%</th></tr></thead>
              <tbody>
                <tr><td>4.50%</td><td class="good">21.2%</td><td class="good">21.8%</td><td class="good">22.4%</td><td class="good">23.1%</td><td class="good">23.8%</td></tr>
                <tr><td>4.75%</td><td class="good">19.8%</td><td class="good">20.4%</td><td class="good">21.0%</td><td class="good">21.6%</td><td class="good">22.3%</td></tr>
                <tr><td>5.00%</td><td class="ok">17.9%</td><td class="ok">18.5%</td><td class="ok">19.1%</td><td class="good">19.8%</td><td class="good">20.4%</td></tr>
                <tr><td>5.25% (base)</td><td class="ok">16.8%</td><td class="ok">17.3%</td><td class="base">18.6%</td><td class="ok">19.0%</td><td class="ok">19.6%</td></tr>
                <tr><td>5.50%</td><td class="warn">14.2%</td><td class="ok">15.1%</td><td class="ok">15.9%</td><td class="ok">16.7%</td><td class="ok">17.4%</td></tr>
                <tr><td>5.75%</td><td class="warn">12.1%</td><td class="warn">13.0%</td><td class="warn">13.8%</td><td class="warn">14.6%</td><td class="ok">15.4%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- PROPERTY TAB -->
    <div id="property-tab" style="display:none;">
      <div class="card"><div class="sp-hdr">Linked Property <span class="sp-hdr-a">Open Full Record →</span></div>
        <div class="prop-mini">
          <div class="prop-mini-addr">4900 Workman Mill Rd — Industry, CA 91746</div>
          <div class="prop-mini-sub">Dock-High Distribution · M-2 Zoning · Owner-User</div>
          <div class="prop-spec-strip"><div class="pss-cell"><div class="pss-lbl">Building SF</div><div class="pss-val hi">312,000</div></div><div class="pss-cell"><div class="pss-lbl">Clear Ht</div><div class="pss-val">32'</div></div><div class="pss-cell"><div class="pss-lbl">Dock Doors</div><div class="pss-val">36 DH · 4 GL</div></div><div class="pss-cell"><div class="pss-lbl">Year Built</div><div class="pss-val">1998</div></div></div>
          <div class="prop-spec-strip"><div class="pss-cell"><div class="pss-lbl">Land AC</div><div class="pss-val">14.2 ac</div></div><div class="pss-cell"><div class="pss-lbl">Power</div><div class="pss-val">2,000A/277V</div></div><div class="pss-cell"><div class="pss-lbl">Sprinklers</div><div class="pss-val hi">ESFR</div></div><div class="pss-cell"><div class="pss-lbl">Coverage</div><div class="pss-val">50.5%</div></div></div>
          <div class="prop-mini-footer"><div style="display:flex;gap:8px;"><span class="hb hb-blue" style="font-size:10.5px;padding:4px 9px;">Lease Exp. Aug 2027</span><span class="hb" style="background:var(--amber-bg);border:1px solid var(--amber-bdr);color:var(--amber);font-size:10.5px;padding:4px 9px;">In-Place: $0.82/SF NNN</span></div><div class="prop-mini-link">Open Property Record →</div></div>
        </div>
      </div>
    </div>

    <!-- CONTACTS TAB -->
    <div id="contacts-tab" style="display:none;">
      <div class="card"><div class="sp-hdr">Deal Contacts <span class="sp-hdr-a">+ Add Contact</span></div>
        <div class="sp-row"><span class="sp-key"><span style="font-weight:500;color:var(--ink2);">James Okura</span><br><span style="font-size:11.5px;">EVP Operations · Pacific Mfg</span></span><span class="sp-val blue link">Primary LOI Contact</span></div>
        <div class="sp-row"><span class="sp-key"><span style="font-weight:500;color:var(--ink2);">RJ Neu</span><br><span style="font-size:11.5px;">Owner · RJ Neu Properties</span></span><span class="sp-val amber">Decision Maker</span></div>
        <div class="sp-row"><span class="sp-key"><span style="font-weight:500;color:var(--ink2);">Mark Yessayan</span><br><span style="font-size:11.5px;">CFO · Pacific Mfg</span></span><span class="sp-val">Lease Sign-off</span></div>
      </div>
    </div>

    <!-- BUYERS TAB -->
    <div id="buyers-tab" style="display:none;">
      <div class="card"><div class="card-hdr"><div class="card-title">Buyer Matches</div><span class="card-action">+ Add Buyer</span></div>
        <div class="buyer-row"><div class="buyer-avatar">BX</div><div><div class="buyer-name">Blackstone Industrial</div><div class="buyer-sub">SLB buyer · 300K+ SF SGV · Top-tier</div></div><span class="buyer-match high">94% match</span></div>
        <div class="buyer-row"><div class="buyer-avatar">PL</div><div><div class="buyer-name">Prologis</div><div class="buyer-sub">Core buyer · SGV strategy · LOI ready</div></div><span class="buyer-match high">89% match</span></div>
        <div class="buyer-row"><div class="buyer-avatar">RX</div><div><div class="buyer-name">Rexford Industrial</div><div class="buyer-sub">Value-add · Active SGV acquirer</div></div><span class="buyer-match med">76% match</span></div>
        <div class="buyer-row"><div class="buyer-avatar">EA</div><div><div class="buyer-name">EQT Exeter</div><div class="buyer-sub">SLB specialist · Core+ buyer</div></div><span class="buyer-match med">71% match</span></div>
        <div class="tl-more"><span class="tl-more-text">View all 8 buyer matches →</span></div>
      </div>
    </div>

    <!-- FILES TAB -->
    <div id="files-tab" style="display:none;">
      <div class="card"><div class="sp-hdr">Files <span class="sp-hdr-a">+ Upload</span></div>
        <div class="sp-row"><span class="sp-key">LOI_Draft_v2.pdf</span><span class="sp-val blue link">View ↗</span></div>
        <div class="sp-row"><span class="sp-key">UW_Model_Pacific_Mfg_v3.xlsx</span><span class="sp-val blue link">View ↗</span></div>
        <div class="sp-row"><span class="sp-key">SLB_Investor_Summary.pdf</span><span class="sp-val blue link">View ↗</span></div>
        <div class="sp-row"><span class="sp-key">Aerial_4900_Workman.jpg</span><span class="sp-val blue link">View ↗</span></div>
        <div class="sp-row"><span class="sp-key">SaleComp_Analysis_SGV.xlsx</span><span class="sp-val blue link">View ↗</span></div>
      </div>
    </div>

  </div><!-- /inner -->
</div></div></main>

<script>
const map=L.map('map',{zoomControl:false,scrollWheelZoom:false,dragging:false,doubleClickZoom:false,attributionControl:false}).setView([34.0058,-117.9775],16);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20}).addTo(map);
L.divIcon&&L.marker([34.0058,-117.9775],{icon:L.divIcon({className:'',html:'<div style="width:14px;height:14px;border-radius:50%;background:#6480A2;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map);

setTimeout(()=>{
  document.getElementById('prob-fill').style.width='81%';
  setTimeout(()=>{document.getElementById('vb-deal').style.width='87%';},100);
  setTimeout(()=>{document.getElementById('vb-stage').style.width='64%';},200);
  setTimeout(()=>{document.getElementById('vb-owner').style.width='92%';},300);
},300);

let synthOpen=true;
function toggleSynth(){synthOpen=!synthOpen;document.getElementById('synth-body').style.display=synthOpen?'':'none';document.getElementById('synth-toggle').textContent=synthOpen?'Hide ▴':'Show ▾';}

const panels=['timeline','uw','property','contacts','buyers','files'];
function showTab(t){
  panels.forEach(id=>{const el=document.getElementById(id+'-tab');if(el)el.style.display='none';});
  const el=document.getElementById(t+'-tab');if(el)el.style.display='';
  document.querySelectorAll('.tab-item').forEach(e=>e.classList.remove('active'));
  const i={timeline:0,uw:1,property:2,contacts:3,buyers:4,files:5}[t];
  document.querySelectorAll('.tab-item')[i]?.classList.add('active');
}

function setUWView(v){
  document.querySelectorAll('.uw-toggle-btn').forEach((b,i)=>b.classList.toggle('active',(v==='quick'&&i===0)||(v==='dashboard'&&i===1)));
  document.getElementById('uw-quick').style.display=v==='quick'?'':'none';
  document.getElementById('uw-dashboard').style.display=v==='dashboard'?'':'none';
}
function runUW(){document.querySelectorAll('.uw-val').forEach(el=>{el.style.opacity='0.25';setTimeout(()=>el.style.opacity='1',500);});}

let logType='call';
function setLT(btn,type){document.querySelectorAll('.log-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');logType=type;document.getElementById('log-input').placeholder={call:'Log a call...',email:'Log an email...',note:'Add a note...',meet:'Log a meeting...'}[type];}
function logEntry(){
  const val=document.getElementById('log-input').value.trim();if(!val)return;
  const m={call:{cls:'call',ic:'📞'},email:{cls:'email',ic:'✉'},note:{cls:'note',ic:'📝'},meet:{cls:'meet',ic:'🤝'}};
  const{cls,ic}=m[logType]||m.call;
  const row=document.createElement('div');row.className='act-row';
  row.style.cssText='animation:row-in 0.25s ease both;border-left:3px solid var(--blue);';
  row.innerHTML=`<div class="act-icon ${cls}">${ic}</div><div class="act-body"><div class="act-text">${val}</div><div class="act-meta">Briana Corso · Just now</div></div><div class="act-date">Today</div>`;
  const list=document.getElementById('act-list');list.insertBefore(row,list.firstChild);
  document.getElementById('log-input').value='';
  setTimeout(()=>row.style.borderLeft='',2500);
}

const steps=['Accept $46M counter — communicate to buyer group by Apr 4 and advance to PSA stage while Dec 2026 urgency window is intact.','Engage title company to confirm unencumbered status and clear any easements before PSA execution.','Circulate updated $46M model to institutional buyer group; confirm lease structure with Pacific Mfg counsel this week.','Follow up with James Okura to confirm LOI acceptance timeline — board decision expected by Apr 8.'];
let si=0;
function refreshNext(){si=(si+1)%steps.length;const el=document.getElementById('ai-next-body');el.style.opacity='0.2';setTimeout(()=>{el.textContent=steps[si];el.style.opacity='1';},240);}
</script>
</body></html>
