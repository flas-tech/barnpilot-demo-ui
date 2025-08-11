
/* BarnPilot Offline Demo (Full CRUD + Import/Export) */
const APP_STORAGE_KEY = 'barnpilot_demo_state_v2';

const DemoState = {
  horses: [
    { id:'H001', name:'Bella', owner:'Jordan', stall:'A1', boardType:'Full', notes:'Sensitive to alfalfa', photo:'' },
    { id:'H002', name:'Apollo', owner:'Smith', stall:'A2', boardType:'Pasture', notes:'Prefers snaffle', photo:'' },
    { id:'H003', name:'Maverick', owner:'Taylor', stall:'B1', boardType:'Full', notes:'Cribbing collar', photo:'' },
  ],
  staff: [
    { id:'S001', name:'Taylor Jordan', role:'Trainer', phone:'555-201-0404' },
    { id:'S002', name:'Chris Lane', role:'Barn Manager', phone:'555-201-1122' },
    { id:'S003', name:'Sam Patel', role:'Groom', phone:'555-201-2244' },
  ],
  clients: [
    { id:'C001', name:'Jordan Family', email:'jordan@example.com' },
    { id:'C002', name:'Smith Family', email:'smith@example.com' },
  ],
  invoices: [
    { id:'INV-1001', clientId:'C001', date:'2025-08-01', status:'Open', items:[
      {desc:'Full Board - Bella (Aug)', qty:1, price:1550},
      {desc:'Lessons (8)', qty:8, price:50},
    ]},
    { id:'INV-1002', clientId:'C002', date:'2025-08-01', status:'Paid', items:[
      {desc:'Pasture Board - Apollo (Aug)', qty:1, price:550},
    ]},
  ],
  schedule: [
    { id:'EVT-1', title:'Lesson: Bella w/ Taylor', horseId:'H001', staffId:'S001', date:'2025-08-11', start:'10:00', end:'10:45', arena:'Main', type:'Lesson' },
    { id:'EVT-2', title:'Turnout: Apollo', horseId:'H002', staffId:'S003', date:'2025-08-11', start:'09:00', end:'12:00', arena:'-', type:'Care' },
    { id:'EVT-3', title:'Schooling: Maverick', horseId:'H003', staffId:'S001', date:'2025-08-11', start:'14:00', end:'14:45', arena:'Main', type:'Schooling' },
  ],
  shows: [
    { id:'SH-001', name:'WEC Ocala Summer', location:'Ocala, FL', start:'2025-08-20', end:'2025-08-24', horses:['H001','H003'], notes:'Stalls reserved' },
    { id:'SH-002', name:'Tryon Fall I', location:'Tryon, NC', start:'2025-09-12', end:'2025-09-15', horses:['H002'], notes:'Ship Thursday' },
  ],
  tasks: [
    { id:'T-1', title:'AM Feed', due:'2025-08-11 07:00', assignee:'S002', status:'Done' },
    { id:'T-2', title:'Stall mucking', due:'2025-08-11 11:00', assignee:'S003', status:'In Progress' },
    { id:'T-3', title:'Drag arena', due:'2025-08-11 13:00', assignee:'S002', status:'Todo' },
  ],
  barn: {
    stalls:[
      { id:'A1', horseId:'H001' },
      { id:'A2', horseId:'H002' },
      { id:'B1', horseId:'H003' },
      { id:'B2', horseId:null },
    ],
    feeds:[
      { horseId:'H001', am:'2 flakes timothy + grain', pm:'2 flakes + supps' },
      { horseId:'H002', am:'Pasture', pm:'1 flake coastal' },
      { horseId:'H003', am:'1.5 flakes alfalfa mix', pm:'1.5 flakes + electrolytes' },
    ]
  },
  settings: { barnName:'Crosswind Stables (Demo)', darkMode:false }
};

function loadState(){
  const raw = localStorage.getItem(APP_STORAGE_KEY);
  if(!raw){ saveState(DemoState); return structuredClone(DemoState); }
  try{ return JSON.parse(raw); }catch(e){ console.warn('Reset state', e); saveState(DemoState); return structuredClone(DemoState); }
}
function saveState(s){ localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(s)); }
let state = loadState();

// Routes
const Routes = {
  '#/': DashboardView,
  '#/schedule': ScheduleView,
  '#/horses': HorsesView,
  '#/staff': StaffView,
  '#/billing': BillingView,
  '#/shows': ShowsView,
  '#/messages': MessagesView,
  '#/barn': BarnSetupView,
  '#/reports': ReportsView,
  '#/live': LiveBoardView,
  '#/settings': SettingsView,
};

function mountApp(){
  const app = document.getElementById('app');
  app.innerHTML = ShellLayout();
  bindShell();
  routeTo(location.hash || '#/');
  if(state.settings.darkMode) document.documentElement.classList.add('dark');
}
function routeTo(hash){
  const main = document.getElementById('main');
  const view = Routes[hash] || Routes['#/'];
  main.innerHTML = view();
}
window.addEventListener('hashchange', ()=> routeTo(location.hash));

// Shell
function ShellLayout(){
  const today = new Date().toISOString().slice(0,10);
  return `
  <div class="app-shell bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
    <aside class="sidebar hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-4">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-2xl bg-brand-600 text-white grid place-items-center text-2xl shadow-soft">🐴</div>
        <div>
          <div class="font-bold text-slate-800 dark:text-white">BarnPilot</div>
          <div class="text-xs text-slate-500">${state.settings.barnName}</div>
        </div>
      </div>
      <nav class="space-y-1 text-sm">
        ${NavLink('#/','Dashboard','Home')}
        ${NavLink('#/schedule','Schedule','CalendarDays')}
        ${NavLink('#/horses','Horses','Horse')}
        ${NavLink('#/staff','Staff','Users')}
        ${NavLink('#/billing','Billing','FileText')}
        ${NavLink('#/shows','Shows','Trophy')}
        ${NavLink('#/messages','Client Updates','MessageSquare')}
        ${NavLink('#/barn','Barn Setup','Cog')}
        ${NavLink('#/reports','Reports','BarChart')}
        ${NavLink('#/live','Live Board','Monitor')}
        <div class="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800"></div>
        ${NavLink('#/settings','Settings','Settings')}
      </nav>
      <div class="mt-auto pt-6 text-xs text-slate-500">
        <div>Local Demo • ${today}</div>
        <button id="reset-state" class="mt-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Reset Demo Data</button>
      </div>
    </aside>

    <header class="topbar col-span-2 md:col-span-1 flex items-center justify-between px-4 md:px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div class="hidden md:flex gap-2 items-center text-sm">
        <span class="badge">Horses: ${state.horses.length}</span>
        <span class="badge">Open Invoices: ${state.invoices.filter(i=>i.status==='Open').length}</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="toggle-dark" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm">Toggle Theme</button>
      </div>
    </header>

    <main id="main" class="main p-4 md:p-6"></main>
  </div>

  <div id="modal-backdrop" class="modal-backdrop">
    <div class="modal">
      <div class="flex items-center justify-between">
        <h3 id="modal-title" class="text-lg font-semibold">Modal</h3>
        <button id="modal-close" class="p-2 rounded-lg hover:bg-slate-100">✕</button>
      </div>
      <div id="modal-body" class="mt-3"></div>
      <div class="mt-4 flex justify-end gap-2 actionbar">
        <button id="modal-delete" class="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 hidden">Delete</button>
        <button id="modal-cancel" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">Cancel</button>
        <button id="modal-save" class="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700">Save</button>
      </div>
    </div>
  </div>
  `;
}
function bindShell(){
  document.getElementById('toggle-dark').onclick = () => {
    document.documentElement.classList.toggle('dark');
    state.settings.darkMode = document.documentElement.classList.contains('dark');
    saveState(state);
  };
  const reset = document.getElementById('reset-state');
  if(reset) reset.onclick = () => { localStorage.removeItem(APP_STORAGE_KEY); state = loadState(); routeTo(location.hash || '#/'); };
}
function icon(name){
  const map = { Home:'🏠', CalendarDays:'🗓️', Horse:'🐴', Users:'👥', FileText:'📄', Trophy:'🏆', MessageSquare:'💬', Cog:'⚙️', BarChart:'📊', Monitor:'🖥️', Settings:'🛠️' };
  return map[name] || '•';
}
function NavLink(href, label, iconName){
  const active = location.hash === href ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800';
  return `<a href="${href}" class="flex items-center gap-3 px-3 py-2 rounded-lg ${active}"><span class="text-lg">${icon(iconName)}</span><span>${label}</span></a>`;
}

// Views
function DashboardView(){
  const upcoming = state.schedule.sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)).slice(0,4).map(ev => `
    <li class="flex items-center justify-between py-2">
      <div><div class="font-medium">${ev.title}</div><div class="text-xs text-slate-500">${ev.date} ${ev.start}–${ev.end} • ${ev.arena}</div></div>
      <span class="tag">${ev.type}</span>
    </li>`).join('');
  return `
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <section class="lg:col-span-2 space-y-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-lg">Today at a glance</h2>
          <a href="#/schedule" class="text-brand-700 hover:underline text-sm">Open schedule →</a>
        </div>
        <ul>${upcoming}</ul>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${Stat('Horses', state.horses.length)}
        ${Stat('Staff', state.staff.length)}
        ${Stat('Open Invoices', state.invoices.filter(i=>i.status==='Open').length)}
      </div>
      <div class="card p-5">
        <h3 class="font-semibold mb-3">Recent Activity</h3>
        <ul class="space-y-2 text-sm" id="activity-log"></ul>
      </div>
    </section>
    <aside class="space-y-6">
      <div class="card p-5">
        <h3 class="font-semibold mb-4">Quick Add</h3>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn" onclick="openModal('New Event', EventForm(), saveEvent)">+ Event</button>
          <button class="btn" onclick="openModal('New Horse', HorseForm(), saveHorse)">+ Horse</button>
          <button class="btn" onclick="openModal('New Invoice', InvoiceForm(), saveInvoice)">+ Invoice</button>
          <button class="btn" onclick="openModal('New Task', TaskForm(), saveTask)">+ Task</button>
        </div>
      </div>
    </aside>
  </div>`;
}
function Stat(label, value){ return `<div class="card p-5"><div class="text-sm text-slate-500">${label}</div><div class="text-3xl font-bold mt-1">${value}</div></div>`; }

function ScheduleView(){
  const hours = Array.from({length:13}, (_,i)=> 7+i);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function cell(dayIdx, hour){
    const evs = state.schedule.filter(ev => new Date(ev.date).getDay()===dayIdx && parseInt(ev.start.split(':')[0])===hour);
    return `<div class="calendar-cell">${evs.map(e=> `<div class="event-chip" onclick="openModal('Edit Event', EventForm('${e.id}'), saveEvent, deleteEvent('${e.id}'))">${e.title}</div>`).join('')}</div>`;
  }
  return `
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-semibold text-lg">Weekly Schedule</h2>
    <div class="flex gap-2">
      <button class="btn" onclick="openModal('Add Event', EventForm(), saveEvent)">+ Add Event</button>
      <button class="btn-secondary" onclick="exportJSON()">Export JSON</button>
      <label class="btn-secondary cursor-pointer">Import JSON<input id="import-json" type="file" accept="application/json" class="hidden" onchange="importJSON(event)"></label>
    </div>
  </div>
  <div class="card p-4">
    <div class="grid grid-cols-8 gap-2 mb-2"><div></div>${days.map(d=> `<div class="text-center font-medium">${d}</div>`).join('')}</div>
    <div class="calendar-grid">${hours.map(h=> `<div class="calendar-hour">${String(h).padStart(2,'0')}:00</div>${days.map((_,i)=> cell(i,h)).join('')}`).join('')}</div>
  </div>`;
}

function HorsesView(){
  const rows = state.horses.map(h=> `
    <tr>
      <td class="font-medium">${h.name}</td>
      <td>${h.owner}</td>
      <td><span class="tag">${h.boardType}</span></td>
      <td>${h.stall || '-'}</td>
      <td class="text-right space-x-2">
        <button class="link" onclick="openModal('Edit Horse', HorseForm('${h.id}'), saveHorse, deleteHorse('${h.id}'))">Edit</button>
      </td>
    </tr>`).join('');
  return `
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-semibold text-lg">Horses</h2>
    <div class="flex gap-2">
      <button class="btn" onclick="openModal('Add Horse', HorseForm(), saveHorse)">+ Add Horse</button>
      <button class="btn-secondary" onclick="exportJSON()">Export</button>
      <label class="btn-secondary cursor-pointer">Import<input id="imp1" type="file" accept="application/json" class="hidden" onchange="importJSON(event)"></label>
    </div>
  </div>
  <div class="card p-4 overflow-x-auto">
    <table class="table">
      <thead><tr><th>Name</th><th>Owner</th><th>Board</th><th>Stall</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function StaffView(){
  const rows = state.staff.map(s=> `
    <tr>
      <td class="font-medium">${s.name}</td>
      <td>${s.role}</td>
      <td>${s.phone}</td>
      <td class="text-right">
        <button class="link" onclick="openModal('Edit Staff', StaffForm('${s.id}'), saveStaff, deleteStaff('${s.id}'))">Edit</button>
      </td>
    </tr>`).join('');
  return `
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-semibold text-lg">Staff</h2>
    <button class="btn" onclick="openModal('Add Staff', StaffForm(), saveStaff)">+ Add Staff</button>
  </div>
  <div class="card p-4 overflow-x-auto">
    <table class="table">
      <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function BillingView(){
  const rows = state.invoices.map(inv=>{
    const client = state.clients.find(c=>c.id===inv.clientId)?.name || inv.clientId;
    const amt = inv.items.reduce((s,it)=> s + it.qty*it.price, 0);
    return `<tr>
      <td class="font-medium">${inv.id}</td>
      <td>${client}</td>
      <td>${inv.date}</td>
      <td><span class="tag">${inv.status}</span></td>
      <td class="text-right">$${amt.toLocaleString()}</td>
      <td class="text-right">
        <button class="link" onclick="openModal('Edit Invoice', InvoiceForm('${inv.id}'), saveInvoice, deleteInvoice('${inv.id}'))">Edit</button>
      </td>
    </tr>`;
  }).join('');
  return `
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-semibold text-lg">Billing & Invoices</h2>
    <div class="flex gap-2">
      <button class="btn" onclick="openModal('New Invoice', InvoiceForm(), saveInvoice)">+ New Invoice</button>
      <button class="btn-secondary" onclick="exportJSON()">Export</button>
      <label class="btn-secondary cursor-pointer">Import<input id="imp2" type="file" accept="application/json" class="hidden" onchange="importJSON(event)"></label>
    </div>
  </div>
  <div class="card p-4 overflow-x-auto">
    <table class="table">
      <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Status</th><th>Amount</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function ShowsView(){
  const cards = state.shows.map(sh=> `
  <div class="card p-4">
    <div class="flex items-center justify-between">
      <div><div class="font-semibold">${sh.name}</div><div class="text-sm text-slate-500">${sh.location}</div></div>
      <div class="text-sm">${sh.start} → ${sh.end}</div>
    </div>
    <div class="mt-3 text-sm">Horses: ${sh.horses.map(hid => state.horses.find(h=>h.id===hid)?.name).join(', ')}</div>
    <div class="mt-2 text-sm text-slate-600">${sh.notes || ''}</div>
    <div class="mt-3 text-right">
      <button class="link" onclick="openModal('Edit Show', ShowForm('${sh.id}'), saveShow, deleteShow('${sh.id}'))">Edit</button>
    </div>
  </div>`).join('');
  return `
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-semibold text-lg">Shows</h2>
    <button class="btn" onclick="openModal('Add Show', ShowForm(), saveShow)">+ Add Show</button>
  </div>
  <div class="grid md:grid-cols-2 gap-4">${cards}</div>`;
}

function MessagesView(){
  return `
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-5">
      <h3 class="font-semibold mb-3">Client Update (Template)</h3>
      <div class="space-y-2 text-sm">
        <label class="block">Horse<select id="msg-horse" class="input">${state.horses.map(h=> `<option value="${h.id}">${h.name}</option>`).join('')}</select></label>
        <label class="block">Focus Area<input id="msg-focus" class="input" placeholder="flatwork, gymnastics, etc."></label>
        <label class="block">Observations<textarea id="msg-obs" class="input" rows="3"></textarea></label>
        <label class="block">Plan<input id="msg-plan" class="input" placeholder="schooling schedule, show goals, etc."></label>
      </div>
      <div class="mt-4"><button class="btn" onclick="generateMessage()">Generate</button></div>
    </div>
    <div class="card p-5">
      <h3 class="font-semibold mb-3">Preview</h3>
      <pre id="msg-preview" class="text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-md"></pre>
      <div class="mt-3 text-right"><button class="btn-secondary" onclick="copyPreview()">Copy</button></div>
    </div>
  </div>`;
}

function BarnSetupView(){
  const stallCards = state.barn.stalls.map(st => {
    const h = state.horses.find(x=> x.id===st.horseId);
    return `<div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div class="text-xs text-slate-500">Stall ${st.id}</div>
      <div class="mt-1 font-medium">${h ? h.name : '— empty —'}</div>
      <div class="mt-2 text-right">
        <button class="link" onclick="assignStall('${st.id}')">${h ? 'Reassign' : 'Assign'}</button>
        <button class="link text-red-700 ml-2" onclick="deleteStall('${st.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
  const feedRows = state.barn.feeds.map(f=> `
    <tr>
      <td class="font-medium">${state.horses.find(h=>h.id===f.horseId)?.name || f.horseId}</td>
      <td>${f.am}</td>
      <td>${f.pm}</td>
      <td class="text-right">
        <button class="link" onclick="openModal('Edit Feed', FeedForm('${f.horseId}'), saveFeed, deleteFeed('${f.horseId}'))">Edit</button>
      </td>
    </tr>`).join('');
  return `
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">Stalls</h3>
        <button class="btn-secondary" onclick="openModal('Add Stall', StallForm(), saveStall)">+ Add Stall</button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">${stallCards}</div>
    </div>
    <div class="card p-5">
      <h3 class="font-semibold mb-3">Feed Schedule</h3>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>Horse</th><th>AM</th><th>PM</th><th></th></tr></thead>
          <tbody>${feedRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function ReportsView(){
  const lessons = state.schedule.filter(e=> e.type==='Lesson').length;
  const avgLessonsPerHorse = (lessons / Math.max(1,state.horses.length)).toFixed(1);
  const fullBoard = state.horses.filter(h=>h.boardType==='Full').length;
  const revenueOpen = state.invoices.filter(i=>i.status==='Open').reduce((s,i)=> s + i.items.reduce((ss,it)=> ss+it.qty*it.price,0),0);
  const text = `${state.settings.barnName} — Weekly Summary

• ${lessons} lessons scheduled this week (avg ${avgLessonsPerHorse}/horse).
• ${fullBoard}/${state.horses.length} horses on Full Board.
• Open invoice balance: $${revenueOpen.toLocaleString()}.
• Next show: ${state.shows[0]?.name || 'N/A'} starting ${state.shows[0]?.start || '—'}.
`;
  return `
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-5">
      <h3 class="font-semibold mb-3">Usage & Billing</h3>
      <ul class="space-y-2 text-sm">
        <li>Lessons scheduled: <strong>${lessons}</strong></li>
        <li>Avg lessons per horse: <strong>${avgLessonsPerHorse}</strong></li>
        <li>Full board horses: <strong>${fullBoard}</strong></li>
        <li>Open invoice balance: <strong>$${revenueOpen.toLocaleString()}</strong></li>
      </ul>
    </div>
    <div class="card p-5">
      <h3 class="font-semibold mb-3">Narrative Summary</h3>
      <pre class="whitespace-pre-wrap text-sm">${text.trim()}</pre>
      <div class="mt-3 text-right">
        <button class="btn-secondary" onclick="copyText(this.previousElementSibling)">Copy</button>
      </div>
    </div>
  </div>`;
}

function LiveBoardView(){
  const tiles = state.tasks.map(t=> `
    <div class="card p-4">
      <div class="text-xs text-slate-500">${t.due}</div>
      <div class="mt-1 font-semibold">${t.title}</div>
      <div class="mt-2"><span class="badge">${t.status}</span> <span class="badge">Assigned: ${t.assignee}</span></div>
      <div class="mt-3 text-right">
        <button class="link" onclick="openModal('Edit Task', TaskForm('${t.id}'), saveTask, deleteTask('${t.id}'))">Edit</button>
      </div>
    </div>`).join('');
  return `
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-semibold text-lg">Live Status Board</h2>
    <div class="flex gap-2">
      <button class="btn-secondary" onclick="location.requestFullscreen && document.documentElement.requestFullscreen()">Fullscreen</button>
      <button class="btn" onclick="openModal('Add Task', TaskForm(), saveTask)">+ Add Task</button>
    </div>
  </div>
  <div class="live-board">${tiles}</div>`;
}

function SettingsView(){
  return `
  <div class="card p-5 max-w-xl">
    <h3 class="font-semibold mb-3">Settings</h3>
    <label class="block mb-2 text-sm">Barn Name
      <input id="set-barn" class="input" value="${state.settings.barnName}">
    </label>
    <div class="flex items-center gap-2 mt-2">
      <input id="set-dark" type="checkbox" ${state.settings.darkMode?'checked':''}/>
      <label for="set-dark" class="text-sm">Enable dark mode</label>
    </div>
    <div class="mt-4 flex gap-2">
      <button class="btn" onclick="saveSettings()">Save</button>
      <button class="btn-secondary" onclick="exportJSON()">Export JSON</button>
      <label class="btn-secondary cursor-pointer">Import JSON<input id="import-settings" type="file" accept="application/json" class="hidden" onchange="importJSON(event)"></label>
    </div>
  </div>`;
}

// Helpers
function input(name, label, value='', type='text'){ return `<label class="block mb-2 text-sm">${label}<input name="${name}" type="${type}" class="input" value="${value||''}"></label>`; }
function select(name, label, options, value){ return `<label class="block mb-2 text-sm">${label}
  <select name="${name}" class="input">${options.map(o=> `<option value="${o.value}" ${o.value===value?'selected':''}>${o.label}</option>`).join('')}</select></label>`; }

// Forms
function EventForm(id=null){
  const ev = id ? structuredClone(state.schedule.find(e=> e.id===id)) : {id:null,title:'', horseId:state.horses[0]?.id||'', staffId:state.staff[0]?.id||'', date:'', start:'', end:'', arena:'Main', type:'Lesson'};
  const horses = state.horses.map(h=> ({value:h.id, label:h.name}));
  const staff = state.staff.map(s=> ({value:s.id, label:s.name}));
  return `<form id="event-form" data-id="${ev.id||''}">
    ${input('title','Title',ev.title)}
    ${select('horseId','Horse',horses,ev.horseId)}
    ${select('staffId','Staff',staff,ev.staffId)}
    ${input('date','Date',ev.date,'date')}
    <div class="grid grid-cols-2 gap-2">
      ${input('start','Start',ev.start,'time')}
      ${input('end','End',ev.end,'time')}
    </div>
    ${input('arena','Arena',ev.arena)}
    ${select('type','Type',[{value:'Lesson',label:'Lesson'},{value:'Schooling',label:'Schooling'},{value:'Care',label:'Care'}],ev.type)}
  </form>`;
}
function HorseForm(id=null){
  const h = id ? structuredClone(state.horses.find(x=>x.id===id)) : {id:null,name:'', owner:'', stall:'', boardType:'Full', notes:''};
  return `<form id="horse-form" data-id="${h.id||''}">
    ${input('name','Name',h.name)}
    ${input('owner','Owner',h.owner)}
    ${input('stall','Stall',h.stall)}
    ${select('boardType','Board',[{value:'Full',label:'Full'},{value:'Pasture',label:'Pasture'}],h.boardType)}
    <label class="block mb-2 text-sm">Notes<textarea name="notes" class="input" rows="3">${h.notes||''}</textarea></label>
  </form>`;
}
function StaffForm(id=null){
  const s = id ? structuredClone(state.staff.find(x=>x.id===id)) : {id:null,name:'', role:'', phone:''};
  return `<form id="staff-form" data-id="${s.id||''}">${input('name','Name',s.name)}${input('role','Role',s.role)}${input('phone','Phone',s.phone)}</form>`;
}
function InvoiceForm(id=null){
  const inv = id ? structuredClone(state.invoices.find(i=>i.id===id)) : {id:`INV-${Math.floor(Math.random()*9000+1000)}`, clientId: state.clients[0]?.id, date: new Date().toISOString().slice(0,10), status:'Open', items:[]};
  const clients = state.clients.map(c=> ({value:c.id, label:c.name}));
  return `<form id="invoice-form" data-id="${inv.id}">
    ${input('id','Invoice #',inv.id)}
    ${select('clientId','Client',clients,inv.clientId)}
    ${input('date','Date',inv.date,'date')}
    ${select('status','Status',[{value:'Open',label:'Open'},{value:'Paid',label:'Paid'}],inv.status)}
    <div class="mt-2">
      <div class="flex items-center justify-between mb-2">
        <div class="font-medium">Line Items</div>
        <button type="button" class="btn-secondary" onclick="addLineItem()">+ Add Item</button>
      </div>
      <div id="invoice-items">${(inv.items||[]).map((it,idx)=> LineItemRow(it, idx)).join('')}</div>
    </div>
  </form>`;
}
function LineItemRow(it={}, idx){
  return `<div class="grid grid-cols-12 gap-2 mb-2" data-idx="${idx}">
    <input class="input col-span-6" placeholder="Description" value="${it.desc||''}">
    <input class="input col-span-2" type="number" placeholder="Qty" value="${it.qty||1}">
    <input class="input col-span-3" type="number" placeholder="Price" value="${it.price||0}">
    <button type="button" class="btn-danger col-span-1" onclick="this.parentElement.remove()">×</button>
  </div>`;
}
function addLineItem(){ document.getElementById('invoice-items').insertAdjacentHTML('beforeend', LineItemRow()); }

function ShowForm(id=null){
  const sh = id ? structuredClone(state.shows.find(x=>x.id===id)) : {id:null,name:'', location:'', start:'', end:'', horses:[], notes:''};
  const horseOptions = state.horses.map(h=> `<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="horses" value="${h.id}" ${id && sh.horses.includes(h.id)?'checked':''}> ${h.name}</label>`).join('');
  return `<form id="show-form" data-id="${sh.id||''}">
    ${input('name','Name',sh.name)}
    ${input('location','Location',sh.location)}
    <div class="grid grid-cols-2 gap-2">${input('start','Start',sh.start,'date')}${input('end','End',sh.end,'date')}</div>
    <div class="mt-2"><div class="text-sm font-medium mb-1">Horses</div><div class="grid grid-cols-2 gap-2">${horseOptions}</div></div>
    <label class="block mt-2 text-sm">Notes<textarea name="notes" class="input" rows="3">${sh.notes||''}</textarea></label>
  </form>`;
}
function FeedForm(horseId){
  const f = state.barn.feeds.find(x=>x.horseId===horseId) || {horseId, am:'', pm:''};
  const horses = state.horses.map(h=> ({value:h.id, label:h.name}));
  return `<form id="feed-form" data-id="${horseId}">
    ${select('horseId','Horse',horses,f.horseId)}
    ${input('am','AM Feed',f.am)}
    ${input('pm','PM Feed',f.pm)}
  </form>`;
}
function StallForm(){ return `<form id="stall-form">${input('id','Stall ID','')}</form>`; }
function TaskForm(id=null){
  const t = id ? structuredClone(state.tasks.find(x=>x.id===id)) : {id:null,title:'', due:'', assignee: state.staff[0]?.name || '', status:'Todo'};
  return `<form id="task-form" data-id="${t.id||''}">
    ${input('title','Title',t.title)}${input('due','Due (YYYY-MM-DD HH:mm)',t.due)}${input('assignee','Assignee',t.assignee)}
    ${select('status','Status',[{value:'Todo',label:'Todo'},{value:'In Progress',label:'In Progress'},{value:'Done',label:'Done'}],t.status)}
  </form>`;
}

// Modal
function openModal(title, bodyHTML, onSave, onDelete){
  const b = document.getElementById('modal-backdrop');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const delBtn = document.getElementById('modal-delete');
  delBtn.classList.toggle('hidden', !onDelete);
  b.classList.add('show');

  const saveBtn = document.getElementById('modal-save');
  const cancel = document.getElementById('modal-cancel');
  const close = document.getElementById('modal-close');

  const cleanup = () => {
    b.classList.remove('show');
    saveBtn.onclick = cancel.onclick = close.onclick = null;
    if(delBtn){ delBtn.onclick = null; delBtn.classList.add('hidden'); }
  };
  cancel.onclick = close.onclick = cleanup;
  saveBtn.onclick = () => { if(onSave) onSave(); cleanup(); routeTo(location.hash||'#/'); };
  if(onDelete){ delBtn.onclick = () => { onDelete(); cleanup(); routeTo(location.hash||'#/'); }; }
}

// Save/Delete handlers
function saveEvent(){
  const form = document.getElementById('event-form'); const data = Object.fromEntries(new FormData(form).entries());
  const id = form.dataset.id || ('EVT-'+Math.floor(Math.random()*9999));
  const idx = state.schedule.findIndex(e=> e.id===id);
  const ev = { id, title:data.title, horseId:data.horseId, staffId:data.staffId, date:data.date, start:data.start, end:data.end, arena:data.arena, type:data.type };
  if(idx>=0) state.schedule[idx]=ev; else state.schedule.push(ev);
  saveState(state);
}
function deleteEvent(id){ return ()=> { state.schedule = state.schedule.filter(e=> e.id!==id); saveState(state);} }

function saveHorse(){
  const form = document.getElementById('horse-form'); const data = Object.fromEntries(new FormData(form).entries());
  const id = form.dataset.id || ('H'+Math.floor(Math.random()*9000));
  const idx = state.horses.findIndex(h=> h.id===id);
  const h = { id, name:data.name, owner:data.owner, stall:data.stall, boardType:data.boardType, notes:data.notes };
  if(idx>=0) state.horses[idx]=h; else state.horses.push(h);
  // update stall assignment display if stall id matches
  const stall = state.barn.stalls.find(s=> s.id===h.stall); if(stall) stall.horseId = id;
  saveState(state);
}
function deleteHorse(id){ return ()=> {
  state.horses = state.horses.filter(h=> h.id!==id);
  state.schedule = state.schedule.filter(e=> e.horseId!==id);
  state.barn.stalls.forEach(s=> { if(s.horseId===id) s.horseId=null; });
  state.barn.feeds = state.barn.feeds.filter(f=> f.horseId!==id);
  state.shows.forEach(sh=> sh.horses = sh.horses.filter(hid=> hid!==id));
  saveState(state);
}}

function saveStaff(){
  const form = document.getElementById('staff-form'); const data = Object.fromEntries(new FormData(form).entries());
  const id = form.dataset.id || ('S'+Math.floor(Math.random()*9000));
  const idx = state.staff.findIndex(s=> s.id===id);
  const s = { id, name:data.name, role:data.role, phone:data.phone };
  if(idx>=0) state.staff[idx]=s; else state.staff.push(s);
  saveState(state);
}
function deleteStaff(id){ return ()=> { state.staff = state.staff.filter(s=> s.id!==id); state.schedule = state.schedule.filter(e=> e.staffId!==id); saveState(state);} }

function saveInvoice(){
  const form = document.getElementById('invoice-form');
  const data = Object.fromEntries(new FormData(form).entries());
  const invId = data.id.trim();
  const items = Array.from(document.querySelectorAll('#invoice-items > div')).map(div => {
    const [desc, qty, price] = div.querySelectorAll('input');
    return { desc: desc.value, qty: Number(qty.value||0), price: Number(price.value||0) };
  });
  const inv = { id:invId, clientId:data.clientId, date:data.date, status:data.status, items };
  const idx = state.invoices.findIndex(i=> i.id===invId);
  if(idx>=0) state.invoices[idx]=inv; else state.invoices.push(inv);
  saveState(state);
}
function deleteInvoice(id){ return ()=> { state.invoices = state.invoices.filter(i=> i.id!==id); saveState(state);} }

function saveShow(){
  const form = document.getElementById('show-form'); const data = Object.fromEntries(new FormData(form).entries());
  const horses = Array.from(form.querySelectorAll('input[name="horses"]:checked')).map(i=> i.value);
  const id = form.dataset.id || ('SH-'+Math.floor(Math.random()*9000));
  const sh = { id, name:data.name, location:data.location, start:data.start, end:data.end, horses, notes:data.notes };
  const idx = state.shows.findIndex(s=> s.id===id);
  if(idx>=0) state.shows[idx]=sh; else state.shows.push(sh);
  saveState(state);
}
function deleteShow(id){ return ()=> { state.shows = state.shows.filter(s=> s.id!==id); saveState(state);} }

function saveFeed(){
  const form = document.getElementById('feed-form'); const data = Object.fromEntries(new FormData(form).entries());
  const idx = state.barn.feeds.findIndex(f=> f.horseId===data.horseId);
  const obj = { horseId:data.horseId, am:data.am, pm:data.pm };
  if(idx>=0) state.barn.feeds[idx]=obj; else state.barn.feeds.push(obj);
  saveState(state);
}
function deleteFeed(horseId){ return ()=> { state.barn.feeds = state.barn.feeds.filter(f=> f.horseId!==horseId); saveState(state);} }

function saveStall(){
  const form = document.getElementById('stall-form'); const data = Object.fromEntries(new FormData(form).entries());
  if(!data.id) return;
  state.barn.stalls.push({ id:data.id, horseId:null });
  saveState(state);
}
function deleteStall(id){ state.barn.stalls = state.barn.stalls.filter(s=> s.id!==id); saveState(state); routeTo('#/barn'); }

function saveTask(){
  const form = document.getElementById('task-form'); const data = Object.fromEntries(new FormData(form).entries());
  const id = form.dataset.id || ('T-'+Math.floor(Math.random()*9000));
  const idx = state.tasks.findIndex(t=> t.id===id);
  const t = { id, title:data.title, due:data.due, assignee:data.assignee, status:data.status };
  if(idx>=0) state.tasks[idx]=t; else state.tasks.push(t);
  saveState(state);
}
function deleteTask(id){ return ()=> { state.tasks = state.tasks.filter(t=> t.id!==id); saveState(state);} }

// Assign stall modal
function assignStall(stallId){
  const horseOpts = state.horses.map(h=> `<option value="${h.id}">${h.name}</option>`).join('');
  openModal('Assign Stall', `<form id="assign-stall"><label class="block text-sm">Horse<select name="horseId" class="input">${horseOpts}</select></label></form>`, ()=>{
    const hid = new FormData(document.getElementById('assign-stall')).get('horseId');
    const st = state.barn.stalls.find(s=> s.id===stallId); st.horseId = hid;
    const h = state.horses.find(x=>x.id===hid); if(h) h.stall = stallId;
    saveState(state);
  });
}

// Messages
function generateMessage(){
  const horseId = document.getElementById('msg-horse').value;
  const horse = state.horses.find(h=>h.id===horseId);
  const owner = state.clients.find(c=> c.name.includes(horse.owner))?.name || horse.owner;
  const focus = document.getElementById('msg-focus').value || 'flatwork basics';
  const obs = document.getElementById('msg-obs').value || 'consistent and attentive';
  const plan = document.getElementById('msg-plan').value || 'continue twice-weekly lessons and light show prep';
  const trainer = state.staff.find(s=> s.role==='Trainer')?.name || 'Trainer';
  const text = `Hi ${owner},

${horse.name} had a productive week. We focused on ${focus}. In lessons, ${horse.name} was ${obs}. For next week, we'll ${plan}.

– ${trainer}`;
  document.getElementById('msg-preview').textContent = text;
}
function copyPreview(){ navigator.clipboard.writeText(document.getElementById('msg-preview').textContent); }

// Settings
function saveSettings(){
  state.settings.barnName = document.getElementById('set-barn').value;
  const dark = document.getElementById('set-dark').checked;
  state.settings.darkMode = dark;
  if(dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  saveState(state);
}

// Import/Export
function exportJSON(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'barnpilot-demo-data.json'; a.click();
  URL.revokeObjectURL(url);
}
function importJSON(evt){
  const file = evt.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try{
      const obj = JSON.parse(reader.result);
      // basic schema guard
      if(!obj || typeof obj!=='object' || !obj.horses || !obj.schedule){ alert('Invalid JSON'); return; }
      state = obj; saveState(state); routeTo(location.hash || '#/');
    }catch(e){ alert('Failed to import JSON'); }
  };
  reader.readAsText(file);
}
function copyText(pre){ navigator.clipboard.writeText(pre.textContent); }

// Style helpers via tailwind directives
const styleInjections = document.createElement('style');
styleInjections.innerHTML = `
  .btn { @apply px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 text-sm; }
  .btn-secondary { @apply px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm dark:bg-slate-800 dark:hover:bg-slate-700; }
  .btn-danger { @apply px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800; }
  .link { @apply text-brand-700 hover:underline; }
  .input { @apply mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white; }
`;
document.head.appendChild(styleInjections);

// Boot
mountApp();
