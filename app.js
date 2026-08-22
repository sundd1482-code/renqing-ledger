/* ============================================================
 * 人情账本 · app.js
 * 人情往来记账 — 数据层 + 业务逻辑 + UI 渲染
 * 数据持久化：LocalStorage
 * ============================================================ */

// ====== 全局状态 ======
let DB = {
  persons: [],    // 人员档案
  records: []     // 人情记录
};
let currentFilter = 'all';
let currentRecordType = 'out';
let currentEvent = null;
let selectedPersonId = null;
let editingPersonId = null;
let batchRows = [];
let batchRecordType = 'in';
let batchEvent = null;
let currentReminderFilter = 'all';

// ====== 事件类型配置 ======
const EVENT_TYPES = [
  { key: '结婚',   icon: '💍' },
  { key: '满月',   icon: '👶' },
  { key: '生日',   icon: '🎂' },
  { key: '乔迁',   icon: '🏠' },
  { key: '升学',   icon: '🎓' },
  { key: '丧事',   icon: '🕊' },
  { key: '节日',   icon: '🎉' },
  { key: '其他',   icon: '📋' }
];

// ====== 头像颜色池 ======
const AVATAR_COLORS = [
  '#e74c3c', '#3498db', '#27ae60', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e84393',
  '#2d3436', '#0984e3'
];

/* ====== 农历转换模块 ======
 * 农历数据表：1900-2100年每年用十六进制编码
 * 每年信息：闰月|各月大小|闰月天数，通过位运算解析
 */
const LUNAR_INFO = [
0x04bd8,0x04ae0,0x0a570,0x054d8,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e5,0x092e0,0x1c8d7,0x0c950,
0x0d4a4,0x1d8a0,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x097a0,0x09552,0x149b0,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x1d555,0x0ab54,0x095b0,
0x049b5,0x0a950,0x0b4a0,0x0aa50,0x1b5a0,0x06d20,0x095d0,0x054a8,0x0b6c0,0x0ada50,
0x04b60,0x0a370,0x052e0,0x0c8c0,0x0c950,0x0d6a0,0x0b550,0x056a0,0x1a5b4,0x025d0,
0x092d0,0x0d2b2,0x0a950,0x0b557,0x097a0,0x09552,0x14977,0x04a50,0x0a4b0,0x0b4b5,
0x06a50,0x1d555,0x0ab54,0x095b0,0x049b5,0x0a950,0x0b4a0,0x0aa50,0x1b5a0,0x06d20,
0x095d0,0x054a8,0x0b6c0,0x0ada50,0x04b60,0x0a370,0x052e0,0x0c8c0,0x0c950,0x0d6a0,
0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x097a0,0x09552,
0x149b0,0x04a50,0x0a4b0,0x0b4b5,0x06a50,0x1d555,0x0ab54,0x095b0,0x049b5,0x0a950,
0x0b4a0,0x0aa50,0x1b5a0,0x06d40,0x095d0,0x052f0,0x0b6c0,0x0a9d0,0x09550,0x04b60,
0x0a570,0x054a8,0x0a4a0,0x0d260,0x0e2c0,0x0c9d0,0x0d550,0x1a5a0,0x0a5d0,0x095d0,
0x0c950,0x0b4a0,0x0b550,0x0c6c0,0x0c950,0x1d8a0,0x0b4b0,0x0b4b5,0x06a50,0x1d555,
0x0ab54,0x095b0,0x049b5,0x0a950,0x0b4a0,0x0aa50,0x1b5a0,0x06d40,0x095d0,0x052f0,
0x0b6c0,0x0a9d0,0x09550,0x04b60,0x0a570,0x054a8,0x0a4a0,0x0d260,0x0e2c0,0x0c9d0,
0x0d550,0x1a5a0,0x0a5d0,0x095d0,0x0c950,0x0b4a0,0x0b550,0x0c6c0,0x0c950,0x1d8a0,
0x0b4b0,0x0b4b5,0x06a50,0x1d555,0x0ab54,0x095b0,0x049b5,0x0a950,0x0b4a0,0x0aa50,
0x1b5a0,0x06d40,0x095d0,0x052f0,0x0b6c0,0x0a9d0,0x09550,0x04b60
];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

// 农历某年总天数
function lunarYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  return sum + leapDays(y);
}
// 闰月天数
function leapDays(y) {
  if (leapMonth(y)) return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
  return 0;
}
// 闰几月
function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
// 某月天数（非闰月）
function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }

// 农历转公历：lunarY年/lunarM月(1-12)/lunarD日/是否闰月 → 公历Date
function lunar2solar(lunarY, lunarM, lunarD, isLeap) {
  if (lunarY < 1900 || lunarY > 2100) return null;
  let offset = 0;
  for (let y = 1900; y < lunarY; y++) offset += lunarYearDays(y);
  let leap = leapMonth(lunarY);
  let isAdd = false;
  for (let m = 1; m < lunarM; m++) {
    if (leap > 0 && m === leap) { offset += leapDays(lunarY); isAdd = true; }
    offset += monthDays(lunarY, m);
  }
  if (leap > 0 && lunarM === leap && !isAdd) { isAdd = true; }
  if (isAdd) offset += monthDays(lunarY, lunarM - 1 < 1 ? 1 : lunarM - 1);
  offset += lunarD - 1;
  // 公历1900-01-31为农历1900正月初一
  const base = new Date(1900, 0, 31);
  const solar = new Date(base.getTime() + offset * 86400000);
  return solar;
}

// 格式化农历日期文本
function formatLunarDate(dateStr) {
  if (!dateStr) return '';
  // dateStr 格式: "农历M-D" 或 "lunarM-D"
  const m = dateStr.match(/(\d{1,2})-(\d{1,2})/);
  if (!m) return dateStr;
  const month = parseInt(m[1]);
  const day = parseInt(m[2]);
  return `农历${LUNAR_MONTHS[month-1] || month}月${LUNAR_DAYS[day-1] || day}`;
}

// 根据人员生日对象计算下一次生日的公历日期
// birthday: "YYYY-MM-DD" 或 "农历M-D"
// calType: 'solar' | 'lunar'
// 返回: { date: Date, display: "农历X月X日" 或 "X月X日" }
function getNextBirthday(person) {
  if (!person.birthday) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (person.calType === 'lunar') {
    // 农历生日：解析月日
    const m = person.birthday.match(/(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    const lunarM = parseInt(m[1]);
    const lunarD = parseInt(m[2]);
    // 尝试今年和明年
    for (let year = today.getFullYear(); year <= today.getFullYear() + 1; year++) {
      const solar = lunar2solar(year, lunarM, lunarD, false);
      if (solar) {
        const checkDate = new Date(solar.getFullYear(), solar.getMonth(), solar.getDate());
        if (checkDate >= today) {
          return { date: checkDate, display: formatLunarDate(person.birthday), isLunar: true };
        }
      }
    }
    return null;
  } else {
    // 阳历生日
    const birth = new Date(person.birthday);
    if (isNaN(birth)) return null;
    let thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (thisYear < today) {
      thisYear = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
    }
    const display = `${birth.getMonth()+1}月${birth.getDate()}日`;
    return { date: thisYear, display, isLunar: false };
  }
}

// ====== 初始化 ======
function init() {
  loadData();
  initEventGrid();
  initTypeSwitch();
  initFilterTabs();
  initPersonSelect();
  setDefaultDate();
  initBatchEventGrid();
  initBatchTypeSwitch();
  initReminderFilter();
  initAnalysisTabs();
  renderFamilyPanel();
  setBatchDate(batchDateValue || todayStr());
  addBatchRow();
  renderHome();
  renderContacts();
  renderMine();
}

// ====== 数据持久化 ======
function loadData() {
  try {
    const saved = localStorage.getItem('renqingDB');
    if (saved) DB = JSON.parse(saved);
  } catch(e) { console.warn('数据加载失败', e); }
  if (!DB.persons) DB.persons = [];
  if (!DB.records) DB.records = [];
  if (!DB.family) DB.family = null;
}

function saveData() {
  localStorage.setItem('renqingDB', JSON.stringify(DB));
}

// ====== UUID 生成 ======
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ====== Toast ======
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2000);
}

// ====== 页面切换 ======
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const pageMap = { home: 'home', add: 'add', contacts: 'contacts', analysis: 'analysis', mine: 'mine' };
  document.getElementById('page-' + pageMap[page]).classList.add('active');
  if (page !== 'add') {
    document.querySelectorAll('.tab').forEach(t => {
      if (t.dataset.page === page) t.classList.add('active');
    });
  } else {
    document.querySelector('.tab-center').classList.add('active');
    // 重置表单
    resetForm();
  }
  if (page === 'home') renderHome();
  if (page === 'contacts') renderContacts();
  if (page === 'analysis') renderAnalysis();
  if (page === 'mine') renderMine();
  window.scrollTo(0, 0);
}

// ====== 初始化事件类型网格 ======
function initEventGrid() {
  const grid = document.getElementById('eventGrid');
  grid.innerHTML = EVENT_TYPES.map(e =>
    `<div class="event-option" data-event="${e.key}" onclick="selectEvent('${e.key}')">
      <span class="e-icon">${e.icon}</span>${e.key}
    </div>`
  ).join('');
}

function selectEvent(key) {
  currentEvent = key;
  document.querySelectorAll('.event-option').forEach(el => {
    el.classList.toggle('active', el.dataset.event === key);
  });
}

// ====== 收支类型切换 ======
function initTypeSwitch() {
  document.querySelectorAll('.type-option').forEach(el => {
    el.onclick = () => {
      currentRecordType = el.dataset.type;
      document.querySelectorAll('.type-option').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
    };
  });
}

// ====== 人员选择（搜索+下拉） ======
function initPersonSelect() {
  const input = document.getElementById('personSearchInput');
  const dropdown = document.getElementById('personDropdown');
  if (!input) return;
  input.oninput = () => filterPersons(input.value);
  input.onfocus = () => { if (input.value.trim()) filterPersons(input.value); };
  // 点击外部关闭下拉
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#personPicker')) {
      dropdown.style.display = 'none';
    }
  });
}

function filterPersons(keyword) {
  const dropdown = document.getElementById('personDropdown');
  const input = document.getElementById('personSearchInput');
  const selectedDiv = document.getElementById('personSelected');

  // 如果已选中人员，输入时清除选中状态
  if (selectedPersonId && input.value.trim()) {
    clearSelectedPerson(false);
  }

  const kw = keyword.trim().toLowerCase();
  if (!kw) {
    dropdown.style.display = 'none';
    return;
  }

  const matched = DB.persons.filter(p =>
    p.name.toLowerCase().includes(kw) || (p.relation || '').toLowerCase().includes(kw)
  ).slice(0, 20);

  if (matched.length === 0) {
    dropdown.innerHTML = '<div class="dropdown-empty">未找到，点击「＋ 新建人员」</div>';
  } else {
    dropdown.innerHTML = matched.map(p => {
      const colorIdx = (p.name.charCodeAt(0) + p.name.length) % AVATAR_COLORS.length;
      return `
        <div class="dropdown-item" onclick="selectPersonFromDropdown('${p.id}')">
          <div class="dd-avatar" style="background:${AVATAR_COLORS[colorIdx]}">${p.name[0]}</div>
          <div class="dd-info">
            <div class="dd-name">${esc(p.name)}</div>
            <div class="dd-relation">${esc(p.relation)}${p.birthday ? ' · 🎂' : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  dropdown.style.display = '';
}

function selectPersonFromDropdown(personId) {
  selectedPersonId = personId;
  const p = DB.persons.find(x => x.id === personId);
  if (!p) return;
  const input = document.getElementById('personSearchInput');
  const dropdown = document.getElementById('personDropdown');
  const selectedDiv = document.getElementById('personSelected');
  const selectedName = document.getElementById('personSelectedName');

  input.value = '';
  input.style.display = 'none';
  dropdown.style.display = 'none';
  selectedDiv.style.display = '';
  selectedName.textContent = `${p.name}（${p.relation}）`;
}

function clearSelectedPerson(focusInput = true) {
  selectedPersonId = null;
  const input = document.getElementById('personSearchInput');
  const selectedDiv = document.getElementById('personSelected');
  const dropdown = document.getElementById('personDropdown');
  if (input) {
    input.value = '';
    input.style.display = '';
    if (focusInput) input.focus();
  }
  if (selectedDiv) selectedDiv.style.display = 'none';
  if (dropdown) dropdown.style.display = 'none';
}

function updatePersonDisplay() {
  // 兼容旧调用：如果有选中人员，显示选中状态
  if (selectedPersonId) {
    const p = DB.persons.find(x => x.id === selectedPersonId);
    if (p) selectPersonFromDropdown(selectedPersonId);
  } else {
    clearSelectedPerson(false);
  }
}

// ====== 日期选择（年月日三个下拉） ======
function setDefaultDate() {
  const now = new Date();
  initDatePicker(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function initDatePicker(defaultYear, defaultMonth, defaultDay) {
  const now = new Date();
  const y = defaultYear || now.getFullYear();
  const m = defaultMonth || now.getMonth() + 1;
  const d = defaultDay || now.getDate();
  setSelectedDate(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
}

/* ====== 滚轮日期选择器（记一笔 / 批量记礼金共用） ======
 * 点一下日期栏 → 弹出三列滚轮（年 / 月 / 日）→ 分别选择 → 确定
 * 不显示周几；月、日联动，自动处理大小月与闰年
 */
let selectedDate = '';            // 记一笔：当前日期 YYYY-MM-DD
let batchDateValue = '';          // 批量记礼金：当前日期 YYYY-MM-DD
let datePickerTarget = 'record';  // 'record' | 'batch' 当前弹窗服务于哪个场景
let wheelScrollTimer = null;
const WHEEL_ITEM_H = 44;          // 滚轮单项高度(px)，与CSS .picker-item 保持一致

function normalizeDate(s) {
  if (!s) return '';
  const parts = String(s).split('-').map(n => parseInt(n));
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  const [y, m, d] = parts;
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function updateDateDisplay(elId, dateStr) {
  const el = document.getElementById(elId);
  if (!el || !dateStr) return;
  const [y, m, d] = dateStr.split('-').map(n => parseInt(n));
  el.textContent = `${y}年${m}月${d}日`;
}

function setSelectedDate(dateStr) {
  selectedDate = normalizeDate(dateStr) || todayStr();
  updateDateDisplay('dateValue', selectedDate);
}

function setBatchDate(dateStr) {
  batchDateValue = normalizeDate(dateStr) || todayStr();
  updateDateDisplay('batchDateValue', batchDateValue);
}

function getSelectedDate() {
  if (!selectedDate) selectedDate = todayStr();
  return selectedDate;
}

/* 'YYYY-MM-DD' → Date（本地时区，避免UTC偏移） */
function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function dateToKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

/* ===== 三列滚轮日期选择器（年 / 月 / 日 分别选择） ===== */
const WHEEL_YEAR_START = 1900;
const WHEEL_YEAR_END = 2100;
let wheelYear = 0, wheelMonth = 0, wheelDay = 0;

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

function buildWheelItems(colId, min, max, selected, suffix) {
  const col = document.getElementById(colId);
  if (!col) return;
  let html = '';
  for (let i = min; i <= max; i++) {
    const active = i === selected ? ' active' : '';
    html += `<div class="picker-item${active}" data-value="${i}">${i}${suffix || ''}</div>`;
  }
  col.innerHTML = html;
}

function scrollColTo(colId, value, smooth) {
  const col = document.getElementById(colId);
  if (!col || !col.children[0]) return;
  const min = parseInt(col.children[0].dataset.value || 0);
  const idx = value - min;
  if (idx < 0 || idx >= col.children.length) return;
  col.scrollTo({ top: idx * WHEEL_ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
}

function getWheelValue(colId) {
  const col = document.getElementById(colId);
  if (!col || col.children.length === 0) return null;
  const idx = Math.min(col.children.length - 1, Math.max(0, Math.round(col.scrollTop / WHEEL_ITEM_H)));
  const el = col.children[idx];
  return el ? parseInt(el.dataset.value) : null;
}

function setWheelHighlight(colId) {
  const col = document.getElementById(colId);
  if (!col) return;
  const idx = Math.min(col.children.length - 1, Math.max(0, Math.round(col.scrollTop / WHEEL_ITEM_H)));
  Array.from(col.children).forEach((el, i) => el.classList.toggle('active', i === idx));
}

/* 根据当前年月刷新“日”列（处理 2 月、大小月） */
function refreshDayWheel() {
  const maxDay = daysInMonth(wheelYear, wheelMonth);
  if (wheelDay > maxDay) wheelDay = maxDay;
  buildWheelItems('wheelDay', 1, maxDay, wheelDay, '日');
  scrollColTo('wheelDay', wheelDay, false);
}

function onWheelScroll(colId, type) {
  clearTimeout(wheelScrollTimer);
  wheelScrollTimer = setTimeout(() => {
    const val = getWheelValue(colId);
    if (val === null) return;
    if (type === 'year') wheelYear = val;
    if (type === 'month') wheelMonth = val;
    if (type === 'day') wheelDay = val;
    setWheelHighlight(colId);
    if (type === 'year' || type === 'month') refreshDayWheel();
  }, 130);
}

function setWheelScrollHandlers() {
  const yearCol = document.getElementById('wheelYear');
  const monthCol = document.getElementById('wheelMonth');
  const dayCol = document.getElementById('wheelDay');
  if (yearCol) yearCol.onscroll = () => onWheelScroll('wheelYear', 'year');
  if (monthCol) monthCol.onscroll = () => onWheelScroll('wheelMonth', 'month');
  if (dayCol) dayCol.onscroll = () => onWheelScroll('wheelDay', 'day');
}

/* 打开弹窗（target: 'record' 或 'batch'） */
function openDatePicker(target) {
  datePickerTarget = target || 'record';
  const cur = datePickerTarget === 'batch' ? (batchDateValue || todayStr()) : getSelectedDate();
  const [y, m, d] = cur.split('-').map(Number);
  const now = new Date();
  wheelYear = y || now.getFullYear();
  wheelMonth = m || now.getMonth() + 1;
  wheelDay = d || now.getDate();

  buildWheelItems('wheelYear', WHEEL_YEAR_START, WHEEL_YEAR_END, wheelYear, '年');
  buildWheelItems('wheelMonth', 1, 12, wheelMonth, '月');
  refreshDayWheel();

  document.getElementById('datePickerModal').classList.add('active');
  setWheelScrollHandlers();
  setTimeout(() => {
    scrollColTo('wheelYear', wheelYear, false);
    scrollColTo('wheelMonth', wheelMonth, false);
    scrollColTo('wheelDay', wheelDay, false);
    setWheelHighlight('wheelYear');
    setWheelHighlight('wheelMonth');
    setWheelHighlight('wheelDay');
  }, 80);
}

function closeDatePicker() {
  document.getElementById('datePickerModal').classList.remove('active');
}

/* 确认选择（按当前停留位置取值，即使刚滑完立即点确定也不丢） */
function confirmDatePicker() {
  const y = getWheelValue('wheelYear') || wheelYear;
  const m = getWheelValue('wheelMonth') || wheelMonth;
  let d = getWheelValue('wheelDay') || wheelDay;
  const maxDay = daysInMonth(y, m);
  if (d > maxDay) d = maxDay;
  const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  if (datePickerTarget === 'batch') setBatchDate(key);
  else setSelectedDate(key);
  closeDatePicker();
}

/* 快捷：滚回今天 */
function wheelGoToday() {
  const now = new Date();
  wheelYear = now.getFullYear();
  wheelMonth = now.getMonth() + 1;
  wheelDay = now.getDate();
  scrollColTo('wheelYear', wheelYear, true);
  scrollColTo('wheelMonth', wheelMonth, true);
  refreshDayWheel();
  setTimeout(() => {
    scrollColTo('wheelDay', wheelDay, true);
    setWheelHighlight('wheelYear');
    setWheelHighlight('wheelMonth');
    setWheelHighlight('wheelDay');
  }, 60);
}


// ====== 重置表单 ======
function resetForm() {
  currentRecordType = 'out';
  currentEvent = null;
  selectedPersonId = null;
  editingRecordId = null;
  document.querySelectorAll('.type-option').forEach(e => e.classList.remove('active'));
  const outOption = document.querySelector('.type-option[data-type="out"]');
  if (outOption) outOption.classList.add('active');
  document.querySelectorAll('.event-option').forEach(e => e.classList.remove('active'));
  document.getElementById('amountInput').value = '';
  document.getElementById('giftInput').value = '';
  document.getElementById('locationInput').value = '';
  document.getElementById('remarkInput').value = '';
  setDefaultDate();
  clearSelectedPerson(false);
  // 隐藏保存按钮的编辑模式标记
  const saveBtn = document.getElementById('saveRecordBtn');
  if (saveBtn) saveBtn.textContent = '保存记录';
  // 隐藏删除按钮（仅编辑模式显示）
  const delBtn = document.getElementById('deleteRecordBtn');
  if (delBtn) delBtn.classList.add('hidden');
}

// ====== 保存记录 ======
let editingRecordId = null;

function saveRecord() {
  const personId = selectedPersonId;
  const amount = parseFloat(document.getElementById('amountInput').value);
  const date = getSelectedDate();
  const gift = document.getElementById('giftInput').value.trim();
  const location = document.getElementById('locationInput').value.trim();
  const remark = document.getElementById('remarkInput').value.trim();

  if (!personId) { toast('请选择人员'); return; }
  if (!currentEvent) { toast('请选择事件类型'); return; }
  if (!amount || amount <= 0) { toast('请输入金额'); return; }
  if (!date) { toast('请选择日期'); return; }

  const person = DB.persons.find(p => p.id === personId);
  if (!person) { toast('人员不存在'); return; }

  if (editingRecordId) {
    // 编辑模式
    const r = DB.records.find(x => x.id === editingRecordId);
    if (!r) { toast('记录不存在'); return; }
    r.personId = personId;
    r.personName = person.name;
    r.type = currentRecordType;
    r.eventType = currentEvent;
    r.amount = amount;
    r.date = date;
    r.gift = gift;
    r.location = location;
    r.remark = remark;
    toast('记录已更新 ✓');
  } else {
    const record = {
      id: uuid(),
      personId,
      personName: person.name,
      type: currentRecordType,
      eventType: currentEvent,
      amount,
      date,
      gift,
      location,
      remark,
      operator: DB.family ? DB.family.myName : '',
      createTime: Date.now()
    };
    DB.records.push(record);
    toast('记录成功 ✓');
  }

  saveData();
  resetForm();
  renderHome();
  renderContacts();
  renderMine();
  if (window._accountPersonId) {
    // 如果从对账弹窗进入编辑，重新打开对账弹窗
    const pid = window._accountPersonId;
    window._accountPersonId = null;
    setTimeout(() => openAccount(pid), 100);
  } else {
    setTimeout(() => switchPage('home'), 800);
  }
}

// ====== 编辑记录（从对账弹窗或记录详情进入） ======
function editRecord(recordId) {
  const r = DB.records.find(x => x.id === recordId);
  if (!r) return;
  closeRecordModal();
  closeAccountModal();
  switchPage('add');
  // 填充表单
  editingRecordId = recordId;
  currentRecordType = r.type;
  currentEvent = r.eventType;
  selectedPersonId = r.personId;
  document.querySelectorAll('.type-option').forEach(e => e.classList.remove('active'));
  const typeEl = document.querySelector(`.type-option[data-type="${r.type}"]`);
  if (typeEl) typeEl.classList.add('active');
  document.querySelectorAll('.event-option').forEach(e => e.classList.remove('active'));
  const eventEl = document.querySelector(`.event-option[data-event="${r.eventType}"]`);
  if (eventEl) eventEl.classList.add('active');
  document.getElementById('amountInput').value = r.amount;
  document.getElementById('giftInput').value = r.gift || '';
  document.getElementById('locationInput').value = r.location || '';
  document.getElementById('remarkInput').value = r.remark || '';
  // 设置日期
  setSelectedDate(r.date);
  // 显示已选中人员
  selectPersonFromDropdown(r.personId);
  // 修改保存按钮文字，并显示删除按钮
  const saveBtn = document.getElementById('saveRecordBtn');
  if (saveBtn) saveBtn.textContent = '保存修改';
  const delBtn = document.getElementById('deleteRecordBtn');
  if (delBtn) delBtn.classList.remove('hidden');
}

// ====== 人员弹窗 ======
function openPersonModal(id) {
  editingPersonId = id || null;
  const modal = document.getElementById('personModal');
  const deleteBtn = document.getElementById('deletePersonBtn');

  if (id) {
    const p = DB.persons.find(x => x.id === id);
    if (!p) return;
    document.getElementById('personName').value = p.name;
    document.getElementById('personRelation').value = p.relation || '朋友';
    document.getElementById('personPhone').value = p.phone || '';
    document.getElementById('personCalType').value = p.calType || 'solar';
    document.getElementById('personBirthday').value = p.calType === 'lunar' ? '' : (p.birthday || '');
    document.getElementById('personNote').value = p.note || '';
    updateCalHint();
    deleteBtn.classList.remove('hidden');
  } else {
    document.getElementById('personName').value = '';
    document.getElementById('personRelation').value = '朋友';
    document.getElementById('personPhone').value = '';
    document.getElementById('personCalType').value = 'solar';
    document.getElementById('personBirthday').value = '';
    document.getElementById('personNote').value = '';
    updateCalHint();
    deleteBtn.classList.add('hidden');
  }
  modal.classList.add('active');
}

// 历法切换时更新提示
function onCalTypeChange() {
  const calType = document.getElementById('personCalType').value;
  const dateInput = document.getElementById('personBirthday');
  const hint = document.getElementById('calHint');
  if (calType === 'lunar') {
    dateInput.type = 'text';
    dateInput.placeholder = '如：3-15 表示农历三月十五';
    dateInput.value = '';
    hint.style.display = '';
    hint.innerHTML = '农历生日格式：月-日（如 8-20 = 农历八月二十）<br>系统自动按当年农历转算公历来计算生日提醒';
  } else {
    dateInput.type = 'date';
    dateInput.placeholder = '';
    hint.style.display = 'none';
  }
}

function updateCalHint() {
  const calType = document.getElementById('personCalType') ? document.getElementById('personCalType').value : 'solar';
  const dateInput = document.getElementById('personBirthday');
  const hint = document.getElementById('calHint');
  if (calType === 'lunar') {
    dateInput.type = 'text';
    dateInput.placeholder = '如：3-15 表示农历三月十五';
    hint.style.display = '';
    hint.innerHTML = '农历生日格式：月-日（如 8-20 = 农历八月二十）<br>系统自动按当年农历转算公历来计算生日提醒';
  } else {
    dateInput.type = 'date';
    dateInput.placeholder = '';
    hint.style.display = 'none';
  }
}

function closePersonModal() {
  document.getElementById('personModal').classList.remove('active');
}

function savePerson() {
  const name = document.getElementById('personName').value.trim();
  if (!name) { toast('请输入姓名'); return; }

  const calType = document.getElementById('personCalType').value;
  let birthday = document.getElementById('personBirthday').value.trim();

  // 农历格式校验
  if (calType === 'lunar' && birthday) {
    const m = birthday.match(/^(\d{1,2})-(\d{1,2})$/);
    if (!m) { toast('农历生日格式：月-日，如 3-15'); return; }
    const lunarM = parseInt(m[1]);
    const lunarD = parseInt(m[2]);
    if (lunarM < 1 || lunarM > 12 || lunarD < 1 || lunarD > 30) { toast('农历月日不合法'); return; }
    // 标准化格式
    birthday = lunarM + '-' + lunarD;
  }

  const data = {
    name,
    relation: document.getElementById('personRelation').value,
    phone: document.getElementById('personPhone').value.trim(),
    birthday,
    calType,
    note: document.getElementById('personNote').value.trim()
  };

  if (editingPersonId) {
    // 编辑
    const p = DB.persons.find(x => x.id === editingPersonId);
    if (p) {
      const oldName = p.name;
      Object.assign(p, data);
      // 同步更新记录中的姓名
      DB.records.forEach(r => { if (r.personId === editingPersonId) r.personName = name; });
    }
    toast('已更新 ✓');
  } else {
    // 新建
    const person = {
      id: uuid(),
      ...data,
      createTime: Date.now()
    };
    DB.persons.push(person);
    toast('人员已添加 ✓');
  }

  saveData();
  closePersonModal();
  initPersonSelect();
  renderContacts();
  renderHome();
  renderMine();
}

function deletePerson() {
  if (!editingPersonId) return;
  const person = DB.persons.find(p => p.id === editingPersonId);
  if (!person) return;
  const recordCount = DB.records.filter(r => r.personId === editingPersonId).length;
  const msg = recordCount > 0
    ? `「${person.name}」有 ${recordCount} 笔记录，删除后记录也会一并删除，确认？`
    : `确认删除「${person.name}」？`;
  if (!confirm(msg)) return;
  DB.persons = DB.persons.filter(p => p.id !== editingPersonId);
  DB.records = DB.records.filter(r => r.personId !== editingPersonId);
  saveData();
  closePersonModal();
  initPersonSelect();
  renderContacts();
  renderHome();
  renderMine();
  toast('已删除');
}

// ====== 筛选标签 ======
function initFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.onclick = () => {
      currentFilter = tab.dataset.rel;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderContacts();
    };
  });
}

// ====== 计算人员统计 ======
function getPersonStats(personId) {
  const records = DB.records.filter(r => r.personId === personId);
  let totalOut = 0, totalIn = 0;
  records.forEach(r => {
    if (r.type === 'out') totalOut += r.amount;
    else totalIn += r.amount;
  });
  return {
    totalOut,
    totalIn,
    balance: totalIn - totalOut, // 正=对方欠我(我送多), 负=我欠对方(我收多)
    count: records.length
  };
}

// ====== 渲染：首页 ======
function renderHome() {
  const year = new Date().getFullYear();
  let yearOut = 0, yearIn = 0;
  DB.records.forEach(r => {
    if (r.date.startsWith(year)) {
      if (r.type === 'out') yearOut += r.amount;
      else yearIn += r.amount;
    }
  });

  // 汇总卡片
  document.getElementById('summaryCards').innerHTML = `
    <div class="summary-card">
      <div class="label">今年送出</div>
      <div class="amount red">¥${fmt(yearOut)}</div>
    </div>
    <div class="summary-card">
      <div class="label">今年收到</div>
      <div class="amount green">¥${fmt(yearIn)}</div>
    </div>
    <div class="summary-card">
      <div class="label">净支出</div>
      <div class="amount ${yearOut - yearIn > 0 ? 'red' : 'green'}">¥${fmt(yearOut - yearIn)}</div>
    </div>
  `;

  // 近期提醒
  renderReminders();
}

// ====== 渲染：提醒 ======
function renderReminders() {
  const reminders = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  DB.persons.forEach(p => {
    if (!p.birthday) return;
    const bday = getNextBirthday(p);
    if (!bday) return;
    const days = Math.ceil((bday.date - today) / (1000 * 60 * 60 * 24));
    if (days <= 7) {
      reminders.push({
        person: p,
        days,
        date: bday.date,
        display: bday.display,
        isLunar: bday.isLunar,
        type: 'birthday'
      });
    }
  });

  reminders.sort((a, b) => a.days - b.days);

  const list = document.getElementById('reminderList');
  const badge = document.getElementById('reminderCount');

  if (reminders.length === 0) {
    list.innerHTML = '<div class="empty-hint">暂无提醒</div>';
    badge.style.display = 'none';
    return;
  }

  badge.style.display = '';
  badge.textContent = reminders.length;

  list.innerHTML = reminders.slice(0, 5).map(r => {
    const urgent = r.days <= 3 ? 'urgent' : '';
    const dayText = r.days === 0 ? '今天' : `${r.days}天后`;
    return `
      <div class="reminder-item ${urgent}" onclick="openReminderCenter()">
        <div class="r-icon">🎂</div>
        <div class="r-content">
          <div class="r-name">${esc(r.person.name)} 生日</div>
          <div class="r-desc">${r.display || formatDate(r.date.toISOString().slice(0,10))}</div>
        </div>
        <div class="r-days">${dayText}</div>
      </div>
    `;
  }).join('');
}

// ====== 渲染：通讯录 ======
function renderContacts() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let persons = DB.persons;

  if (currentFilter !== 'all') {
    persons = persons.filter(p => p.relation === currentFilter);
  }
  if (search) {
    persons = persons.filter(p => p.name.toLowerCase().includes(search) || (p.note || '').toLowerCase().includes(search));
  }

  const list = document.getElementById('contactList');
  if (persons.length === 0) {
    list.innerHTML = '<div class="empty-hint">还没有人员档案，点击右下角「＋」添加</div>';
    return;
  }

  list.innerHTML = persons.map(p => {
    const stats = getPersonStats(p.id);
    const colorIdx = (p.name.charCodeAt(0) + p.name.length) % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIdx];

    let balanceText = '';
    if (stats.balance > 0) {
      // 对方送我多 → 我欠对方回礼
      balanceText = `<span class="debt">我需回礼 ¥${fmt(stats.balance)}</span>`;
    } else if (stats.balance < 0) {
      // 我送出多 → 对方欠我
      balanceText = `<span class="credit">对方欠我 ¥${fmt(-stats.balance)}</span>`;
    } else if (stats.count > 0) {
      balanceText = `<span class="even">已平衡</span>`;
    } else {
      balanceText = `<span class="muted">暂无往来</span>`;
    }

    return `
      <div class="contact-item" onclick="openAccount('${p.id}')">
        <div class="c-top">
          <div class="c-avatar" style="background:${avatarColor}">${p.name[0]}</div>
          <div style="flex:1;">
            <div class="c-name">${p.name}</div>
            <span class="c-relation">${p.relation}</span>
          </div>
        </div>
        <div class="c-stats">
          <div class="c-stat">送出 <span class="out">¥${fmt(stats.totalOut)}</span></div>
          <div class="c-stat">收到 <span class="in">¥${fmt(stats.totalIn)}</span></div>
          <div class="c-stat">${stats.count} 笔</div>
        </div>
        <div class="c-balance">${balanceText}</div>
      </div>
    `;
  }).join('');
}

// ====== 对账弹窗 ======
function openAccount(personId) {
  const person = DB.persons.find(p => p.id === personId);
  if (!person) return;

  const records = DB.records
    .filter(r => r.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const stats = getPersonStats(personId);
  document.getElementById('accountTitle').textContent = `${person.name} · 往来对账`;

  let balanceHtml = '';
  if (stats.balance > 0) {
    balanceHtml = `<span style="color:var(--primary)">对方送我多 ¥${fmt(stats.balance)}，建议回礼</span>`;
  } else if (stats.balance < 0) {
    balanceHtml = `<span style="color:var(--green)">我送出多 ¥${fmt(-stats.balance)}，对方欠我</span>`;
  } else if (stats.count > 0) {
    balanceHtml = `<span class="muted">人情已平衡</span>`;
  } else {
    balanceHtml = `<span class="muted">暂无往来记录</span>`;
  }

  const body = document.getElementById('accountBody');
  body.innerHTML = `
    <div class="balance-bar">${balanceHtml}</div>
    <div class="account-summary">
      <div class="a-box out">
        <div class="a-label">我送出</div>
        <div class="a-value">¥${fmt(stats.totalOut)}</div>
      </div>
      <div class="a-box in">
        <div class="a-label">我收到</div>
        <div class="a-value">¥${fmt(stats.totalIn)}</div>
      </div>
      <div class="a-box diff">
        <div class="a-label">往来笔数</div>
        <div class="a-value">${stats.count}</div>
      </div>
    </div>
    <div style="font-size:0.85rem; font-weight:600; margin-bottom:8px; color:var(--text-light);">
      往来明细（${records.length}笔）
    </div>
    ${records.length === 0 ? '<div class="empty-hint">暂无往来记录</div>' :
      records.map(r => {
        const eventObj = EVENT_TYPES.find(e => e.key === r.eventType) || { icon: '📋' };
        return `
          <div class="account-record">
            <div class="ar-date">${formatDateFull(r.date)}</div>
            <div class="ar-content" onclick="openRecordModal('${r.id}')">
              <div class="ar-event">${eventObj.icon} ${r.eventType}${r.gift ? ' · ' + esc(r.gift) : ''}</div>
              <div class="ar-remark">${r.location ? esc(r.location) + ' · ' : ''}${r.remark ? esc(r.remark) + ' · ' : ''}${r.operator ? '记：' + esc(r.operator) : ''}</div>
            </div>
            <div class="ar-amount ${r.type}">${r.type === 'out' ? '-' : '+'}¥${fmt(r.amount)}</div>
            <div class="ar-edit" onclick="event.stopPropagation(); editRecordFromAccount('${r.id}', '${person.id}')">✏️</div>
          </div>
        `;
      }).join('')
    }
    <div style="display:flex; gap:8px; margin-top:16px;">
      <button class="btn-primary" onclick="addRecordForPerson('${person.id}')">＋ 新增记录</button>
      <button class="btn-outline" onclick="closeAccountModal(); openPersonModal('${person.id}');">编辑人员</button>
    </div>
  `;

  document.getElementById('accountModal').classList.add('active');
}

// 从对账弹窗新增记录（保存后自动回到对账弹窗）
function addRecordForPerson(personId) {
  closeAccountModal();
  switchPage('add');
  editingRecordId = null;
  window._accountPersonId = personId;  // 标记：保存后回到对账弹窗
  selectedPersonId = personId;
  selectPersonFromDropdown(personId);
  // 重置表单
  document.querySelectorAll('.event-option').forEach(e => e.classList.remove('active'));
  currentEvent = null;
  document.getElementById('amountInput').value = '';
  document.getElementById('giftInput').value = '';
  document.getElementById('locationInput').value = '';
  document.getElementById('remarkInput').value = '';
  const saveBtn = document.getElementById('saveRecordBtn');
  if (saveBtn) saveBtn.textContent = '保存记录';
}

// 从对账弹窗编辑记录
function editRecordFromAccount(recordId, personId) {
  window._accountPersonId = personId;
  editRecord(recordId);
}

function closeAccountModal() {
  document.getElementById('accountModal').classList.remove('active');
}

// ====== 记录详情弹窗 ======
function openRecordModal(recordId) {
  const r = DB.records.find(x => x.id === recordId);
  if (!r) return;
  const eventObj = EVENT_TYPES.find(e => e.key === r.eventType) || { icon: '📋' };

  document.getElementById('recordBody').innerHTML = `
    <div style="text-align:center; padding:8px 0 16px;">
      <div style="font-size:2.5rem;">${eventObj.icon}</div>
      <div style="font-size:1.6rem; font-weight:700; margin-top:4px; color:${r.type === 'out' ? 'var(--primary)' : 'var(--green)'};">
        ${r.type === 'out' ? '-' : '+'}¥${fmt(r.amount)}
      </div>
      <div style="font-size:0.8rem; color:var(--text-light); margin-top:4px;">
        ${r.type === 'out' ? '我送出' : '我收到'}
      </div>
    </div>
    <div class="detail-row"><span class="d-label">人员</span><span class="d-value">${r.personName}</span></div>
    <div class="detail-row"><span class="d-label">事件</span><span class="d-value">${r.eventType}</span></div>
    <div class="detail-row"><span class="d-label">日期</span><span class="d-value">${formatDate(r.date)}</span></div>
    ${r.operator ? `<div class="detail-row"><span class="d-label">记录人</span><span class="d-value">${esc(r.operator)}</span></div>` : ''}
    ${r.gift ? `<div class="detail-row"><span class="d-label">实物礼品</span><span class="d-value">${esc(r.gift)}</span></div>` : ''}
    ${r.location ? `<div class="detail-row"><span class="d-label">宴席地点</span><span class="d-value">${esc(r.location)}</span></div>` : ''}
    ${r.remark ? `<div class="detail-row"><span class="d-label">备注</span><span class="d-value">${esc(r.remark)}</span></div>` : ''}
    <div class="detail-actions">
      <button class="btn-primary" onclick="editRecord('${r.id}')">✏️ 编辑</button>
      <button class="btn-danger-outline" onclick="deleteRecord('${r.id}')">删除</button>
      <button class="btn-outline" onclick="closeRecordModal()">关闭</button>
    </div>
  `;
  document.getElementById('recordModal').classList.add('active');
}

function closeRecordModal() {
  document.getElementById('recordModal').classList.remove('active');
}

function deleteRecord(id) {
  if (!confirm('确认删除这条记录？')) return;
  DB.records = DB.records.filter(r => r.id !== id);
  saveData();
  closeRecordModal();
  renderHome();
  renderContacts();
  renderMine();
  toast('已删除');
}

/* 在编辑页（记一笔）删除当前正在编辑的记录 */
function deleteEditingRecord() {
  if (!editingRecordId) return;
  if (!confirm('确认删除这条记录？')) return;
  const pid = window._accountPersonId;
  DB.records = DB.records.filter(r => r.id !== editingRecordId);
  saveData();
  resetForm();
  renderHome();
  renderContacts();
  renderMine();
  toast('已删除');
  if (pid) {
    window._accountPersonId = null;
    setTimeout(() => openAccount(pid), 100);
  } else {
    setTimeout(() => switchPage('home'), 300);
  }
}

// ====== 渲染：我的 ======
function renderMine() {
  renderFamilyPanel();
  const year = new Date().getFullYear();
  let yearOut = 0, yearIn = 0, yearCount = 0;
  let totalOut = 0, totalIn = 0;

  DB.records.forEach(r => {
    if (r.type === 'out') totalOut += r.amount;
    else totalIn += r.amount;
    if (r.date.startsWith(year)) {
      yearCount++;
      if (r.type === 'out') yearOut += r.amount;
      else yearIn += r.amount;
    }
  });

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-box">
      <div class="s-value red">¥${fmt(yearOut)}</div>
      <div class="s-label">今年送出</div>
    </div>
    <div class="stat-box">
      <div class="s-value green">¥${fmt(yearIn)}</div>
      <div class="s-label">今年收到</div>
    </div>
    <div class="stat-box">
      <div class="s-value blue">${yearCount}</div>
      <div class="s-label">今年笔数</div>
    </div>
    <div class="stat-box">
      <div class="s-value orange">${DB.persons.length}</div>
      <div class="s-label">往来人数</div>
    </div>
    <div class="stat-box">
      <div class="s-value red">¥${fmt(totalOut)}</div>
      <div class="s-label">累计送出</div>
    </div>
    <div class="stat-box">
      <div class="s-value green">¥${fmt(totalIn)}</div>
      <div class="s-label">累计收到</div>
    </div>
  `;

  // 排行：按总往来额排序
  const personRanks = DB.persons.map(p => {
    const s = getPersonStats(p.id);
    return { person: p, total: s.totalOut + s.totalIn, ...s };
  }).filter(x => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);

  const rankList = document.getElementById('rankList');
  if (personRanks.length === 0) {
    rankList.innerHTML = '<div class="empty-hint">暂无数据</div>';
  } else {
    rankList.innerHTML = personRanks.map((r, i) => `
      <div class="rank-item">
        <div class="rank-num">${i + 1}</div>
        <div class="r-name">${r.person.name}</div>
        <div class="r-val" style="color:var(--primary)">¥${fmt(r.total)}</div>
      </div>
    `).join('');
  }
}

// ====== 批量添加人员 ======
function openBatchPersonModal() {
  document.getElementById('batchPersonInput').value = '';
  document.getElementById('batchPersonRelation').value = '';
  document.getElementById('batchPersonModal').classList.add('active');
}
function closeBatchPersonModal() {
  document.getElementById('batchPersonModal').classList.remove('active');
}

function saveBatchPersons() {
  const text = document.getElementById('batchPersonInput').value.trim();
  if (!text) { toast('请输入人员信息'); return; }
  const uniformRel = document.getElementById('batchPersonRelation').value;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let added = 0, skipped = 0;
  const existingNames = DB.persons.map(p => p.name);

  lines.forEach(line => {
    const parts = line.split(/[｜|,，\t]/).map(s => s.trim()).filter(s => s);
    if (parts.length === 0) return;
    const name = parts[0];
    if (!name) { skipped++; return; }
    if (existingNames.includes(name)) { skipped++; return; }
    let relation = uniformRel || parts[1] || '朋友';
    const validRels = ['亲戚','朋友','同事','邻居','长辈'];
    if (!validRels.includes(relation)) relation = '朋友';
    let birthday = '', calType = 'solar';
    if (parts[2]) {
      const rawBirth = parts[2];
      // 检查是否以"农"开头
      if (rawBirth.startsWith('农') || rawBirth.startsWith('lunar')) {
        calType = 'lunar';
        const m = rawBirth.match(/(\d{1,2})-(\d{1,2})/);
        if (m) birthday = parseInt(m[1]) + '-' + parseInt(m[2]);
        else { skipped++; return; }
      } else {
        const d = new Date(rawBirth);
        if (!isNaN(d)) birthday = d.toISOString().slice(0, 10);
      }
    }
    DB.persons.push({
      id: uuid(),
      name,
      relation,
      phone: '',
      birthday,
      calType,
      note: '',
      createTime: Date.now()
    });
    existingNames.push(name);
    added++;
  });

  saveData();
  initPersonSelect();
  renderContacts();
  renderHome();
  renderMine();
  closeBatchPersonModal();
  toast(`添加 ${added} 人${skipped > 0 ? `，跳过 ${skipped} 人` : ''} ✓`);
}

// ====== 批量记礼金 ======
function openBatchRecordModal() {
  batchRows = [];
  batchRecordType = 'in';
  batchEvent = null;
  document.getElementById('batchLocation').value = '';
  document.getElementById('batchRemark').value = '';
  setBatchDate(batchDateValue || todayStr());
  document.querySelectorAll('#batchEventGrid .event-option').forEach(e => e.classList.remove('active'));
  document.querySelectorAll('[data-batch-type]').forEach(e => e.classList.remove('active'));
  document.querySelector('[data-batch-type="in"]').classList.add('active');
  addBatchRow();
  renderBatchList();
  document.getElementById('batchRecordModal').classList.add('active');
}

function closeBatchRecordModal() {
  document.getElementById('batchRecordModal').classList.remove('active');
}

function initBatchEventGrid() {
  const grid = document.getElementById('batchEventGrid');
  grid.innerHTML = EVENT_TYPES.map(e =>
    `<div class="event-option" data-event="${e.key}" onclick="selectBatchEvent('${e.key}')">
      <span class="e-icon">${e.icon}</span>${e.key}
    </div>`
  ).join('');
}

function selectBatchEvent(key) {
  batchEvent = key;
  document.querySelectorAll('#batchEventGrid .event-option').forEach(el => {
    el.classList.toggle('active', el.dataset.event === key);
  });
}

function initBatchTypeSwitch() {
  document.querySelectorAll('[data-batch-type]').forEach(el => {
    el.onclick = () => {
      batchRecordType = el.dataset.batchType;
      document.querySelectorAll('[data-batch-type]').forEach(e => e.classList.remove('active'));
      el.classList.add('active');
    };
  });
}

function addBatchRow(name = '', amount = '', gift = '', note = '') {
  const rowId = 'br_' + uuid();
  batchRows.push({ id: rowId, name, amount, gift, note });
  renderBatchList();
}

function removeBatchRow(rowId) {
  batchRows = batchRows.filter(r => r.id !== rowId);
  renderBatchList();
}

function updateBatchRow(rowId, field, value) {
  const row = batchRows.find(r => r.id === rowId);
  if (row) row[field] = value;
  // 实时更新合计
  updateBatchTotal();
}

function renderBatchList() {
  const list = document.getElementById('batchRecordList');
  if (batchRows.length === 0) {
    list.innerHTML = '<div class="empty-hint" style="padding:12px 0;">点击下方「＋ 添加一行」开始</div>';
  } else {
    list.innerHTML = batchRows.map((row, i) => `
      <div class="batch-record-row">
        <div class="br-num">${i + 1}</div>
        <div class="br-name-wrap">
          <input type="text" class="br-name" placeholder="姓名🔍" autocomplete="off" value="${esc(row.name)}" oninput="updateBatchRow('${row.id}','name',this.value);searchBatchGuest(this,'${row.id}')">
          <div class="guest-dropdown" style="display:none"></div>
        </div>
        <input type="number" class="br-amount" placeholder="¥金额" value="${esc(row.amount)}" oninput="updateBatchRow('${row.id}','amount',this.value)">
        <input type="text" class="br-gift" placeholder="礼品(选填)" value="${esc(row.gift)}" oninput="updateBatchRow('${row.id}','gift',this.value)">
        <input type="text" class="br-note" placeholder="备注(选填)" value="${esc(row.note)}" oninput="updateBatchRow('${row.id}','note',this.value)">
        <button class="br-del" onclick="removeBatchRow('${row.id}')">✕</button>
      </div>
    `).join('');
  }
  updateBatchTotal();
}

/* ====== 批量记礼金：来宾通讯录搜索 ====== */
function searchBatchGuest(inputEl, rowId) {
  const kw = inputEl.value.trim().toLowerCase();
  const dd = inputEl.parentElement.querySelector('.guest-dropdown');
  if (!dd) return;
  if (!kw) { dd.style.display = 'none'; return; }
  const matches = DB.persons.filter(p => p.name.toLowerCase().includes(kw)).slice(0, 6);
  if (matches.length === 0) {
    dd.innerHTML = '<div class="gd-item gd-none">通讯录无此人，请先去通讯录添加</div>';
  } else {
    dd.innerHTML = matches.map(p =>
      `<div class="gd-item" onclick="selectBatchGuest('${rowId}','${esc(p.name)}')">${esc(p.name)}<span class="gd-rel">${esc(p.relation || '')}</span></div>`
    ).join('');
  }
  dd.style.display = 'block';
}

function selectBatchGuest(rowId, name) {
  const row = batchRows.find(r => r.id === rowId);
  if (row) row.name = name;
  renderBatchList();
}

function updateBatchTotal() {
  let total = 0, count = 0;
  batchRows.forEach(r => {
    const amt = parseFloat(r.amount);
    if (amt > 0 && r.name.trim()) { total += amt; count++; }
  });
  document.getElementById('batchTotalAmount').textContent = '¥' + fmt(total);
  document.getElementById('batchTotalCount').textContent = count > 0 ? `· ${count} 笔` : '';
  document.getElementById('batchItemCount').textContent = batchRows.length;
}

function saveBatchRecords() {
  if (!batchEvent) { toast('请选择事件类型'); return; }
  const date = batchDateValue || todayStr();
  const location = document.getElementById('batchLocation').value.trim();
  const remark = document.getElementById('batchRemark').value.trim();
  if (!date) { toast('请选择日期'); return; }

  // 校验：金额必须为数字且不能为负数
  const invalidRows = batchRows.filter(r => r.amount !== '' && (isNaN(parseFloat(r.amount)) || parseFloat(r.amount) < 0));
  if (invalidRows.length > 0) {
    const bad = invalidRows[0];
    const who = bad.name.trim() || `第 ${batchRows.indexOf(bad) + 1} 行`;
    toast(`${who} 的金额无效，请输入正数`);
    return;
  }

  const validRows = batchRows.filter(r => r.name.trim() && r.amount !== '');
  if (validRows.length === 0) { toast('请至少填写一行有效数据'); return; }

  let added = 0, newPersons = 0;
  validRows.forEach(row => {
    const name = row.name.trim();
    const amount = parseFloat(row.amount);
    const gift = row.gift.trim();
    // 行备注优先，没有则用公共备注
    const rowRemark = row.note.trim();
    const finalRemark = rowRemark ? rowRemark : remark;

    // 查找或创建人员（通讯录无则自动添加）
    let person = DB.persons.find(p => p.name === name);
    if (!person) {
      person = { id: uuid(), name, relation: '朋友', phone: '', birthday: '', calType: 'solar', note: '批量记礼金时自动创建', createTime: Date.now() };
      DB.persons.push(person);
      newPersons++;
    }

    const record = {
      id: uuid(),
      personId: person.id,
      personName: person.name,
      type: batchRecordType,
      eventType: batchEvent,
      amount,
      date,
      gift,
      location,
      remark: finalRemark,
      operator: DB.family ? DB.family.myName : '',
      createTime: Date.now()
    };
    DB.records.push(record);
    added++;
  });

  saveData();
  initPersonSelect();
  renderHome();
  renderContacts();
  renderMine();
  closeBatchRecordModal();
  toast(`保存 ${added} 笔记录${newPersons > 0 ? `，新增 ${newPersons} 人` : ''} ✓`);
}

// ====== 提醒中心 ======
function initReminderFilter() {
  document.querySelectorAll('#reminderFilterTabs .filter-tab').forEach(tab => {
    tab.onclick = () => {
      currentReminderFilter = tab.dataset.rfilter;
      document.querySelectorAll('#reminderFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderReminderCenter();
    };
  });
}

function openReminderModal() {}
function closeReminderModal() {
  document.getElementById('reminderModal').classList.remove('active');
}

function openReminderCenter() {
  renderReminderCenter();
  document.getElementById('reminderModal').classList.add('active');
}

function renderReminderCenter() {
  const reminders = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  DB.persons.forEach(p => {
    if (!p.birthday) return;
    const bday = getNextBirthday(p);
    if (!bday) return;
    const days = Math.ceil((bday.date - today) / (1000 * 60 * 60 * 24));
    if (days <= 7) {
      reminders.push({
        person: p,
        days,
        date: bday.date,
        display: bday.display,
        isLunar: bday.isLunar,
        type: 'birthday'
      });
    }
  });

  reminders.sort((a, b) => a.days - b.days);

  const filtered = currentReminderFilter === 'all'
    ? reminders
    : reminders.filter(r => r.type === currentReminderFilter);

  const list = document.getElementById('reminderCenterList');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-hint">暂无提醒</div>';
    return;
  }

  list.innerHTML = filtered.map(r => {
    let tagClass = 'normal', tagText = `${r.days}天后`;
    if (r.days <= 3) { tagClass = 'urgent'; tagText = r.days === 0 ? '今天！' : `${r.days}天后`; }
    else if (r.days <= 7) { tagClass = 'soon'; tagText = `${r.days}天后`; }
    return `
      <div class="reminder-center-item">
        <div class="rc-icon" style="background:#fff3e0;">🎂</div>
        <div class="rc-content">
          <div class="rc-name">${esc(r.person.name)} 生日</div>
          <div class="rc-desc">${esc(r.person.relation)} · ${r.display || formatDate(r.date.toISOString().slice(0,10))}</div>
        </div>
        <div class="rc-tag ${tagClass}">${tagText}</div>
      </div>
    `;
  }).join('');
}

// ====== 家庭共享 ======
function generateFamilyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function renderFamilyPanel() {
  const panel = document.getElementById('familyPanel');
  if (!panel) return;
  if (!DB.family) {
    panel.innerHTML = `
      <div class="family-empty">
        <span class="muted">还没创建家庭，创建后可与家人共享账本</span>
        <div style="display:flex; gap:8px;">
          <button class="btn-outline" onclick="openFamilyModal('create')" style="color:#667eea;border-color:#667eea;">＋ 创建家庭</button>
          <button class="btn-outline" onclick="openFamilyModal('join')">加入家庭</button>
        </div>
      </div>
    `;
  } else {
    const f = DB.family;
    const memberTags = (f.members || [f.myName]).map(m =>
      `<span class="family-member-tag ${m === f.myName ? 'me' : ''}">${esc(m)}${m === f.myName ? ' (我)' : ''}</span>`
    ).join('');
    panel.innerHTML = `
      <div class="family-card">
        <div class="family-code-label">家庭码（点击复制）</div>
        <div class="family-code" onclick="copyText('${f.familyId}', '家庭码已复制 ✓')">${f.familyId}</div>
        <div class="family-name">${esc(f.familyName)}</div>
        <div class="family-members">${memberTags}</div>
      </div>
      <div class="family-actions">
        <button class="btn-outline" onclick="openSyncModal()">🔄 数据同步</button>
        <button class="btn-outline" onclick="openFamilyModal('join')">＋ 邀请成员</button>
        <button class="btn-danger-outline" onclick="leaveFamily()">退出</button>
      </div>
    `;
  }
}

function openFamilyModal(mode) {
  const title = document.getElementById('familyModalTitle');
  const createPanel = document.getElementById('familyCreatePanel');
  const joinPanel = document.getElementById('familyJoinPanel');
  if (mode === 'create') {
    title.textContent = '创建家庭';
    createPanel.style.display = '';
    joinPanel.style.display = 'none';
    document.getElementById('familyNameInput').value = '';
    document.getElementById('myNameInput').value = '';
  } else {
    title.textContent = '加入家庭';
    createPanel.style.display = 'none';
    joinPanel.style.display = '';
    document.getElementById('joinFamilyCode').value = '';
    document.getElementById('joinMyName').value = '';
  }
  document.getElementById('familyModal').classList.add('active');
}

function closeFamilyModal() {
  document.getElementById('familyModal').classList.remove('active');
}

function createFamily() {
  const familyName = document.getElementById('familyNameInput').value.trim();
  const myName = document.getElementById('myNameInput').value.trim();
  if (!familyName) { toast('请输入家庭名称'); return; }
  if (!myName) { toast('请输入你的名字'); return; }
  DB.family = {
    familyId: generateFamilyCode(),
    familyName,
    myName,
    members: [myName]
  };
  saveData();
  closeFamilyModal();
  renderFamilyPanel();
  toast(`家庭「${familyName}」已创建 ✓`);
}

function joinFamily() {
  const code = document.getElementById('joinFamilyCode').value.trim().toUpperCase();
  const myName = document.getElementById('joinMyName').value.trim();
  if (!code || code.length !== 6) { toast('请输入6位家庭码'); return; }
  if (!myName) { toast('请输入你的名字'); return; }

  if (!DB.family) {
    // 全新加入
    DB.family = {
      familyId: code,
      familyName: '我们的家庭',
      myName,
      members: [myName]
    };
    saveData();
    closeFamilyModal();
    renderFamilyPanel();
    toast(`已加入家庭 ✓`);
  } else {
    // 已有家庭，添加新成员
    if (code !== DB.family.familyId) { toast('家庭码与当前家庭不一致'); return; }
    if (!DB.family.members.includes(myName)) {
      DB.family.members.push(myName);
    }
    DB.family.myName = myName;
    saveData();
    closeFamilyModal();
    renderFamilyPanel();
    toast(`已添加成员「${myName}」 ✓`);
  }
}

function leaveFamily() {
  if (!confirm('退出家庭后，当前设备将不再共享数据。\n本地记录仍保留，确定退出？')) return;
  DB.family = null;
  saveData();
  renderFamilyPanel();
  toast('已退出家庭');
}

// ====== 同步码 ======
function openSyncModal() {
  switchSyncTab('export');
  document.getElementById('syncCodeResult').style.display = 'none';
  document.getElementById('syncImportResult').style.display = 'none';
  document.getElementById('importSyncCodeInput').value = '';
  document.getElementById('syncModal').classList.add('active');
}

function closeSyncModal() {
  document.getElementById('syncModal').classList.remove('active');
}

function switchSyncTab(tab) {
  document.querySelectorAll('.sync-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-sync="${tab}"]`).classList.add('active');
  document.getElementById('syncExportPanel').style.display = tab === 'export' ? '' : 'none';
  document.getElementById('syncImportPanel').style.display = tab === 'import' ? '' : 'none';
}

function generateSyncCode() {
  try {
    const exportData = {
      persons: DB.persons,
      records: DB.records,
      family: DB.family ? { ...DB.family } : null,
      exportTime: new Date().toISOString(),
      exportName: DB.family ? DB.family.myName : '未知'
    };
    const json = JSON.stringify(exportData);
    // Base64 编码
    const code = btoa(unescape(encodeURIComponent(json)));
    const prefix = 'RQSYNC:';
    const fullCode = prefix + code;

    document.getElementById('syncCodeText').value = fullCode;
    const recordCount = DB.records.length;
    const personCount = DB.persons.length;
    const time = new Date().toLocaleString('zh-CN');
    document.getElementById('syncCodeInfo').textContent =
      `包含 ${personCount} 人 · ${recordCount} 笔记录 · 生成于 ${time}`;
    document.getElementById('syncCodeResult').style.display = '';
    toast('同步码已生成 ✓');
  } catch(e) {
    console.error(e);
    toast('生成失败，请重试');
  }
}

function copySyncCode() {
  const text = document.getElementById('syncCodeText').value;
  copyText(text, '同步码已复制 ✓');
}

function importSyncCode() {
  const input = document.getElementById('importSyncCodeInput').value.trim();
  const resultDiv = document.getElementById('syncImportResult');
  if (!input) { toast('请粘贴同步码'); return; }

  try {
    const prefix = 'RQSYNC:';
    let code = input;
    if (code.startsWith(prefix)) code = code.substring(prefix.length);
    code = code.trim();

    const json = decodeURIComponent(escape(atob(code)));
    const data = JSON.parse(json);

    if (!data.persons || !data.records) { toast('同步码格式不对'); return; }

    // 智能合并
    let newPersons = 0, newRecords = 0;
    const existingPersonNames = DB.persons.map(p => p.name);
    const existingRecordIds = DB.records.map(r => r.id);

    // 合并人员（按 name 去重）
    data.persons.forEach(p => {
      if (!existingPersonNames.includes(p.name)) {
        // 确保有 id
        if (!p.id) p.id = uuid();
        DB.persons.push(p);
        existingPersonNames.push(p.name);
        newPersons++;
      }
    });

    // 合并记录（按 id 去重）
    data.records.forEach(r => {
      if (!existingRecordIds.includes(r.id)) {
        if (!r.id) r.id = uuid();
        DB.records.push(r);
        existingRecordIds.push(r.id);
        newRecords++;
      }
    });

    // 合并家庭成员
    if (data.family && DB.family) {
      data.family.members.forEach(m => {
        if (!DB.family.members.includes(m)) DB.family.members.push(m);
      });
    } else if (data.family && !DB.family) {
      DB.family = { ...data.family };
    }

    saveData();
    initPersonSelect();
    renderHome();
    renderContacts();
    renderMine();
    renderFamilyPanel();

    resultDiv.style.display = '';
    resultDiv.innerHTML = `
      <div class="batch-tips" style="background:var(--green-bg);">
        ✅ 导入完成！<br>
        新增 ${newPersons} 位人员，${newRecords} 笔记录。<br>
        ${newPersons === 0 && newRecords === 0 ? '（数据已是最新，无新增）' : ''}
      </div>
    `;
    toast(`导入成功：新增 ${newPersons} 人、${newRecords} 笔记录 ✓`);
  } catch(e) {
    console.error(e);
    toast('同步码格式不对，请检查');
    resultDiv.style.display = '';
    resultDiv.innerHTML = `<div class="batch-tips" style="background:var(--primary-bg);">❌ 解析失败，请确认复制了完整的同步码</div>`;
  }
}

// ====== 剪贴板 ======
function copyText(text, msg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => { toast(msg); }).catch(() => fallbackCopy(text, msg));
  } else {
    fallbackCopy(text, msg);
  }
}

function fallbackCopy(text, msg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast(msg); } catch(e) { toast('复制失败，请手动复制'); }
  document.body.removeChild(ta);
}

// ====== 导出Excel ======
function exportExcel() {
  if (DB.records.length === 0) { toast('暂无数据可导出'); return; }

  // 人员汇总sheet
  const personData = DB.persons.map(p => {
    const s = getPersonStats(p.id);
    return {
      '姓名': p.name,
      '关系': p.relation,
      '手机号': p.phone || '',
      '生日': p.birthday || '',
      '历法': p.calType === 'lunar' ? '农历' : '阳历',
      '总送出': s.totalOut,
      '总收到': s.totalIn,
      '人情差额': s.balance > 0 ? `对方多${s.balance}` : s.balance < 0 ? `我多${-s.balance}` : '平衡',
      '往来笔数': s.count,
      '备注': p.note || ''
    };
  });

  // 记录明细sheet
  const recordData = DB.records.map(r => ({
    '日期': r.date,
    '人员': r.personName,
    '事件类型': r.eventType,
    '收支': r.type === 'out' ? '我送出' : '我收到',
    '金额': r.amount,
    '实物礼品': r.gift || '',
    '宴席地点': r.location || '',
    '备注': r.remark || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(recordData);
  ws1['!cols'] = [{wch:12},{wch:10},{wch:10},{wch:8},{wch:10},{wch:12},{wch:14},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws1, '人情明细');

  const ws2 = XLSX.utils.json_to_sheet(personData);
  ws2['!cols'] = [{wch:10},{wch:8},{wch:12},{wch:12},{wch:10},{wch:10},{wch:12},{wch:8},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws2, '人员汇总');

  const fileName = `人情账本_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  toast('Excel已导出 ✓');
}

// ====== JSON备份 ======
function exportJSON() {
  const dataStr = JSON.stringify(DB, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `人情账本备份_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('备份已下载 ✓');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.persons || !data.records) { toast('文件格式不对'); return; }
      if (!confirm(`导入 ${data.persons.length} 名人员、${data.records.length} 笔记录？当前数据将被覆盖！`)) return;
      DB = data;
      saveData();
      initPersonSelect();
      renderHome();
      renderContacts();
      renderMine();
      toast('导入成功 ✓');
    } catch(err) {
      toast('导入失败，文件格式不对');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ====== 导出通讯录模板 ======
function exportPersonTemplate() {
  const template = [
    { '姓名': '张三', '关系': '亲戚', '手机号': '13800138000', '生日': '1985-03-15', '历法': '阳历', '备注': '老婆的表哥' },
    { '姓名': '李四', '关系': '朋友', '手机号': '', '生日': '8-20', '历法': '农历', '备注': '农历八月二十' },
    { '姓名': '王五', '关系': '同事', '手机号': '', '生日': '1990-06-20', '历法': '阳历', '备注': '部门主管' }
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(template);
  ws['!cols'] = [{wch:10},{wch:8},{wch:13},{wch:12},{wch:6},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws, '通讯录模板');
  XLSX.writeFile(wb, '通讯录模板.xlsx');
  toast('通讯录模板已下载 ✓');
}

// ====== 导出礼金往来模板 ======
function exportRecordTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['日期', '姓名', '事件类型', '收支', '金额', '实物礼品', '宴席地点', '备注']
  ]);
  // 设置日期列格式为 Excel 日期序列号
  const sampleDates = ['2025-01-15', '2025-01-15', '2025-02-01'];
  const sampleData = [
    ['2025-01-15', '张三', '结婚', '我收到', 500, '中华烟一条', 'XX大酒店', '红包+礼品'],
    ['2025-01-15', '李四', '结婚', '我收到', 300, '', 'XX大酒店', ''],
    ['2025-02-01', '王五', '满月', '我送出', 600, '水果礼盒', '', '同事孩子满月']
  ];
  sampleData.forEach((row, ri) => {
    const excelRow = ri + 1;
    // 日期单元格：转为 Excel 序列号并设置日期格式
    const dateParts = row[0].split('-');
    const jsDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const excelSerial = Math.round((jsDate.getTime() / 86400000) + 25569);
    ws[XLSX.utils.encode_cell({ r: excelRow, c: 0 })] = {
      t: 'n', v: excelSerial, z: 'yyyy-mm-dd'
    };
    // 其他列正常写入
    for (let ci = 1; ci < row.length; ci++) {
      ws[XLSX.utils.encode_cell({ r: excelRow, c: ci })] = {
        t: typeof row[ci] === 'number' ? 'n' : 's',
        v: row[ci]
      };
    }
  });
  ws['!cols'] = [{wch:12},{wch:10},{wch:10},{wch:8},{wch:8},{wch:14},{wch:14},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws, '礼金往来模板');
  XLSX.writeFile(wb, '礼金往来模板.xlsx');
  toast('礼金往来模板已下载 ✓');
}

// ====== 导入通讯录Excel ======
function importPersonTemplate(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (rows.length === 0) { toast('模板中没有数据'); event.target.value = ''; return; }

      const validRels = ['亲戚','朋友','同事','邻居','长辈'];
      const existingNames = DB.persons.map(p => p.name);
      let added = 0, skipped = 0;

      rows.forEach(row => {
        const name = (row['姓名'] || '').toString().trim();
        if (!name) { skipped++; return; }
        if (existingNames.includes(name)) { skipped++; return; }
        let relation = (row['关系'] || '朋友').toString().trim();
        if (!validRels.includes(relation)) relation = '朋友';
        // 历法
        const rawCal = (row['历法'] || '').toString().trim();
        const calType = (rawCal.includes('农') || rawCal.toLowerCase().includes('lunar')) ? 'lunar' : 'solar';
        let birthday = '';
        const rawBirth = row['生日'];
        if (rawBirth) {
          if (calType === 'lunar') {
            // 农历：提取 M-D
            const m = rawBirth.toString().match(/(\d{1,2})-(\d{1,2})/);
            if (m) birthday = parseInt(m[1]) + '-' + parseInt(m[2]);
            else { skipped++; return; }
          } else if (typeof rawBirth === 'number') {
            const d = new Date((rawBirth - 25569) * 86400 * 1000);
            if (!isNaN(d)) birthday = d.toISOString().slice(0, 10);
          } else {
            const d = new Date(rawBirth);
            if (!isNaN(d)) birthday = d.toISOString().slice(0, 10);
          }
        }
        DB.persons.push({
          id: uuid(),
          name,
          relation,
          phone: (row['手机号'] || '').toString().trim(),
          birthday,
          calType,
          note: (row['备注'] || '').toString().trim(),
          createTime: Date.now()
        });
        existingNames.push(name);
        added++;
      });

      saveData();
      initPersonSelect();
      renderContacts();
      renderHome();
      renderMine();
      toast(`导入 ${added} 人${skipped > 0 ? `，跳过 ${skipped}` : ''} ✓`);
    } catch(err) {
      console.error(err);
      toast('导入失败，请检查文件格式');
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

// ====== 导入礼金往来Excel ======
function importRecordTemplate(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
      if (rows.length === 0) { toast('模板中没有数据'); event.target.value = ''; return; }

      const validEvents = EVENT_TYPES.map(e => e.key);
      let added = 0, newPersons = 0, errors = 0;

      rows.forEach(row => {
        const name = (row['姓名'] || '').toString().trim();
        const amountStr = row['金额'];
        const amount = parseFloat(amountStr);
        if (!name || !amount || amount <= 0) { errors++; return; }

        const rawDate = row['日期'];
        let date = '';
        if (typeof rawDate === 'number') {
          // Excel 日期序列号
          const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          if (!isNaN(d)) date = d.toISOString().slice(0, 10);
        } else if (rawDate instanceof Date) {
          date = rawDate.toISOString().slice(0, 10);
        } else {
          const dateStr = (rawDate || '').toString().trim();
          // 尝试 YYYY-MM-DD 或 YYYY/MM/DD 格式
          const m = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
          if (m) {
            date = `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
          } else {
            const d = new Date(dateStr);
            if (!isNaN(d)) date = d.toISOString().slice(0, 10);
            else date = new Date().toISOString().slice(0, 10);
          }
        }

        let eventType = (row['事件类型'] || '其他').toString().trim();
        if (!validEvents.includes(eventType)) eventType = '其他';

        const收支 = (row['收支'] || '我收到').toString().trim();
        const type = (收支.includes('送') || 收支.includes('出')) ? 'out' : 'in';

        // 查找或创建人员
        let person = DB.persons.find(p => p.name === name);
        if (!person) {
          person = { id: uuid(), name, relation: '朋友', phone: '', birthday: '', note: '', createTime: Date.now() };
          DB.persons.push(person);
          newPersons++;
        }

        const gift = (row['实物礼品'] || '').toString().trim();
        const location = (row['宴席地点'] || '').toString().trim();
        const remark = (row['备注'] || '').toString().trim();

        DB.records.push({
          id: uuid(),
          personId: person.id,
          personName: person.name,
          type,
          eventType,
          amount,
          date,
          gift,
          location,
          remark,
          createTime: Date.now()
        });
        added++;
      });

      saveData();
      initPersonSelect();
      renderHome();
      renderContacts();
      renderMine();
      toast(`导入 ${added} 笔记录${newPersons > 0 ? `，新增 ${newPersons} 人` : ''}${errors > 0 ? `，跳过 ${errors} 行` : ''} ✓`);
    } catch(err) {
      console.error(err);
      toast('导入失败，请检查文件格式');
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

// ====== 清空数据 ======
function clearAllData() {
  if (!confirm('⚠️ 确认清空全部数据？此操作不可恢复！\n\n建议先导出备份！')) return;
  if (!confirm('再次确认：清空所有人员和记录？')) return;
  DB = { persons: [], records: [] };
  saveData();
  initPersonSelect();
  renderHome();
  renderContacts();
  renderMine();
  toast('已清空');
}

// ====== 工具函数 ======
function fmt(n) {
  if (!n) return '0';
  return Math.round(n).toLocaleString('zh-CN');
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth()+1}.${d.getDate()}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
}

// ====== 数据分析页面 ======
let analysisRange = 'all';
let analysisFilter = 'all';
let analysisCustomStart = '';
let analysisCustomEnd = '';

function initAnalysisTabs() {
  // 时间范围标签
  document.querySelectorAll('#analysisRangeTabs .range-tab').forEach(tab => {
    tab.onclick = () => {
      analysisRange = tab.dataset.range;
      document.querySelectorAll('#analysisRangeTabs .range-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const customDiv = document.getElementById('customDateRange');
      customDiv.style.display = analysisRange === 'custom' ? '' : 'none';
      if (analysisRange !== 'custom') renderAnalysis();
    };
  });
  // 关系筛选标签
  document.querySelectorAll('#analysisFilterTabs .filter-tab').forEach(tab => {
    tab.onclick = () => {
      analysisFilter = tab.dataset.rel;
      document.querySelectorAll('#analysisFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderAnalysis();
    };
  });
  // 默认日期
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date().getFullYear() + '-01-01';
  document.getElementById('analysisStartDate').value = yearStart;
  document.getElementById('analysisEndDate').value = today;
}

function applyCustomRange() {
  analysisCustomStart = document.getElementById('analysisStartDate').value;
  analysisCustomEnd = document.getElementById('analysisEndDate').value;
  renderAnalysis();
}

function getAnalysisRecords() {
  let records = DB.records;
  // 时间范围筛选
  if (analysisRange === 'year') {
    const year = new Date().getFullYear();
    records = records.filter(r => r.date.startsWith(year));
  } else if (analysisRange === 'custom' && analysisCustomStart && analysisCustomEnd) {
    records = records.filter(r => r.date >= analysisCustomStart && r.date <= analysisCustomEnd);
  }
  // 关系筛选
  if (analysisFilter !== 'all') {
    const personIds = DB.persons.filter(p => p.relation === analysisFilter).map(p => p.id);
    records = records.filter(r => personIds.includes(r.personId));
  }
  return records;
}

function renderAnalysis() {
  const records = getAnalysisRecords();
  let totalOut = 0, totalIn = 0;
  records.forEach(r => {
    if (r.type === 'out') totalOut += r.amount;
    else totalIn += r.amount;
  });
  const net = totalOut - totalIn;

  // 汇总卡片
  document.getElementById('analysisSummary').innerHTML = `
    <div class="summary-card">
      <div class="label">送出总额</div>
      <div class="amount red">¥${fmt(totalOut)}</div>
    </div>
    <div class="summary-card">
      <div class="label">收到总额</div>
      <div class="amount green">¥${fmt(totalIn)}</div>
    </div>
    <div class="summary-card">
      <div class="label">净支出</div>
      <div class="amount ${net > 0 ? 'red' : 'green'}">¥${fmt(net)}</div>
    </div>
    <div class="summary-card">
      <div class="label">笔数</div>
      <div class="amount blue">${records.length}</div>
    </div>
  `;

  // 按关系分类统计
  const relationStats = {};
  records.forEach(r => {
    const person = DB.persons.find(p => p.id === r.personId);
    const rel = person ? person.relation : '未知';
    if (!relationStats[rel]) relationStats[rel] = { out: 0, in: 0, count: 0 };
    if (r.type === 'out') relationStats[rel].out += r.amount;
    else relationStats[rel].in += r.amount;
    relationStats[rel].count++;
  });
  const relRows = Object.entries(relationStats).sort((a, b) => (b[1].out + b[1].in) - (a[1].out + a[1].in));
  document.getElementById('analysisByRelation').innerHTML = relRows.length === 0
    ? '<div class="empty-hint">暂无数据</div>'
    : `<table class="analysis-table"><thead><tr><th>关系</th><th>送出</th><th>收到</th><th>笔数</th></tr></thead><tbody>
      ${relRows.map(([rel, s]) => `<tr><td>${rel}</td><td class="red">¥${fmt(s.out)}</td><td class="green">¥${fmt(s.in)}</td><td>${s.count}</td></tr>`).join('')}
    </tbody></table>`;

  // 按事件类型统计
  const eventStats = {};
  records.forEach(r => {
    if (!eventStats[r.eventType]) eventStats[r.eventType] = { out: 0, in: 0, count: 0 };
    if (r.type === 'out') eventStats[r.eventType].out += r.amount;
    else eventStats[r.eventType].in += r.amount;
    eventStats[r.eventType].count++;
  });
  const eventRows = Object.entries(eventStats).sort((a, b) => (b[1].out + b[1].in) - (a[1].out + a[1].in));
  document.getElementById('analysisByEvent').innerHTML = eventRows.length === 0
    ? '<div class="empty-hint">暂无数据</div>'
    : `<table class="analysis-table"><thead><tr><th>事件</th><th>送出</th><th>收到</th><th>笔数</th></tr></thead><tbody>
      ${eventRows.map(([evt, s]) => {
        const eObj = EVENT_TYPES.find(e => e.key === evt);
        return `<tr><td>${eObj ? eObj.icon : ''} ${evt}</td><td class="red">¥${fmt(s.out)}</td><td class="green">¥${fmt(s.in)}</td><td>${s.count}</td></tr>`;
      }).join('')}
    </tbody></table>`;

  // 月度趋势
  const monthStats = {};
  records.forEach(r => {
    const month = r.date.slice(0, 7); // YYYY-MM
    if (!monthStats[month]) monthStats[month] = { out: 0, in: 0, count: 0 };
    if (r.type === 'out') monthStats[month].out += r.amount;
    else monthStats[month].in += r.amount;
    monthStats[month].count++;
  });
  const monthRows = Object.entries(monthStats).sort((a, b) => a[0].localeCompare(b[0]));
  document.getElementById('analysisByMonth').innerHTML = monthRows.length === 0
    ? '<div class="empty-hint">暂无数据</div>'
    : `<table class="analysis-table"><thead><tr><th>月份</th><th>送出</th><th>收到</th><th>笔数</th></tr></thead><tbody>
      ${monthRows.map(([month, s]) => `<tr><td>${month}</td><td class="red">¥${fmt(s.out)}</td><td class="green">¥${fmt(s.in)}</td><td>${s.count}</td></tr>`).join('')}
    </tbody></table>`;

  // ===== 明细记录（跟随当前时间范围+关系筛选，时间倒序，点击查看/编辑）=====
  const detailList = document.getElementById('analysisDetails');
  const detailCountEl = document.getElementById('detailCount');
  if (detailList) {
    const sorted = [...records].sort((a, b) =>
      b.date.localeCompare(a.date) || (b.createTime || 0) - (a.createTime || 0)
    );
    if (detailCountEl) detailCountEl.textContent = sorted.length;
    detailList.innerHTML = sorted.length === 0
      ? '<div class="empty-hint">暂无记录</div>'
      : sorted.map(r => {
          const p = DB.persons.find(x => x.id === r.personId);
          const eObj = EVENT_TYPES.find(e => e.key === r.eventType);
          const isOut = r.type === 'out';
          const bits = [p ? p.relation : '', r.gift ? `礼品:${r.gift}` : '', r.remark || ''].filter(Boolean).join(' · ');
          return `<div class="dq-item" onclick="openRecordModal('${r.id}')">
            <div class="dq-date">${r.date.replace(/-/g, '.')}</div>
            <div class="dq-main">
              <div class="dq-name">${esc(r.personName || (p ? p.name : ''))}<span class="dq-event">${eObj ? eObj.icon + ' ' : ''}${r.eventType}</span></div>
              <div class="dq-sub">${bits || '&nbsp;'}</div>
            </div>
            <div class="dq-amount ${isOut ? 'out' : 'in'}">${isOut ? '-' : '+'}¥${fmt(r.amount)}</div>
          </div>`;
        }).join('');
  }
}

// ====== 启动 ======
document.addEventListener('DOMContentLoaded', init);
