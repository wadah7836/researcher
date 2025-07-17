import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://vesahiwbpxwokndexbyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2FoaXdicHh3b2tuZGV4YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTQxNDUsImV4cCI6MjA2NjM3MDE0NX0.FDyPHokVbyQfOZ8R4elOpv2negK0yw0Zf-rd_IwdLkE'
);

// ✅ الحصول على username من الرابط والتحقق من وجوده
const rawUsername = new URLSearchParams(location.search).get("username");

if (!rawUsername) {
  alert("رابط الصفحة لا يحتوي على username");
  throw new Error("username not found in URL");
}

const username = decodeURIComponent(rawUsername);

// ✅ الجداول الفرعية
const tableDefs = {
  education: ['certificate','university','faculty','country','year'],
  titles: ['title','date'],
  certificates: ['certificate','date','description'],
  students: ['name','date','description'],
  positions: ['position','from','to'],
  awards: ['name','description','date'],
  links: ['type', 'url'],
  conferences: ['title', 'details', 'year'],
  workshops: ['title', 'details', 'year'],
  books: ['title', 'details', 'year'],
  patents: ['title', 'details', 'year'],
  courses: ['title', 'details', 'year'],
};

// ✅ إضافة صف فارغ
function addEmptyRow(tableId) {
  const tbody = document.getElementById(tableId).querySelector('tbody');
  const tr = document.createElement('tr');
  tableDefs[tableId].forEach(() => {
    const td = document.createElement('td');
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.autocomplete = 'off';
    td.appendChild(inp);
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

// ✅ زر إضافة صف
document.querySelectorAll('.add-row-btn').forEach(btn => {
  btn.addEventListener('click', () => addEmptyRow(btn.dataset.table));
});

// ✅ تحميل البيانات
async function loadData() {
  const { data: r, error } = await supabase
    .from('researchers')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !r) {
    alert("❌ خطأ في جلب البيانات.");
    return;
  }

  const fields = [
    'name','name_ar','name_en','birthdate','academic_title','degree',
    'general_specialization','specific_specialization','email','specialization','bio','skills'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = r[id] || '';
  });

  ['numPubs', 'numCites', 'hIndex'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = r[id] !== null && r[id] !== undefined ? r[id] : '';
  });

  ['numPubsGS', 'numPubsScopus','numCitesGS', 'numCitesScopus','hIndexGS', 'hIndexScopus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = r[id] !== null && r[id] !== undefined ? r[id] : '';
  });

  Object.entries(tableDefs).forEach(([tid, fields]) => {
    const arr = r[tid] || [];
    const tbody = document.getElementById(tid).querySelector('tbody');
    tbody.innerHTML = '';
    arr.forEach(item => {
      const tr = document.createElement('tr');
      fields.forEach(f => {
        const td = document.createElement('td');
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = item[f] || '';
        td.appendChild(inp);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    addEmptyRow(tid);
  });
}

// ✅ عند الحفظ
document.getElementById("editForm").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    name_ar: document.getElementById("name_ar").value.trim(),
    name_en: document.getElementById("name_en").value.trim(),
    birthdate: document.getElementById("birthdate").value.trim(),
    academic_title: document.getElementById("academic_title").value.trim(),
    degree: document.getElementById("degree").value.trim(),
    general_specialization: document.getElementById("general_specialization").value.trim(),
    specific_specialization: document.getElementById("specific_specialization").value.trim(),
    email: document.getElementById("email").value.trim(),
    specialization: document.getElementById("specialization").value.trim(),
    bio: document.getElementById("bio").value.trim(),
    skills: document.getElementById("skills").value.trim()
  };

  ['numPubs', 'numCites', 'hIndex', 'numPubsGS', 'numPubsScopus', 'numCitesGS', 'numCitesScopus', 'hIndexGS', 'hIndexScopus']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) payload[id] = el.value ? parseInt(el.value) : null;
    });

  Object.entries(tableDefs).forEach(([tid, fields]) => {
    payload[tid] = [];
    document.querySelectorAll(`#${tid} tbody tr`).forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const entry = {};
      let used = false;
      inputs.forEach((inp, i) => {
        const val = inp.value.trim();
        entry[fields[i]] = val;
        if (val) used = true;
      });
      if (used) payload[tid].push(entry);
    });
  });

  const { error } = await supabase
    .from('researchers')
    .update(payload)
    .eq('username', username);

  const msg = document.getElementById("saveMsg");

  if (error) {
    msg.textContent = "❌ فشل في الحفظ!";
    msg.style.color = "red";
  } else {
    msg.textContent = "✔ تم الحفظ بنجاح!";
    msg.style.color = "green";
    localStorage.setItem('selectedResearcherId', username);
    setTimeout(() => {
      window.location.href = `/Profile?username=${encodeURIComponent(username)}`;
    }, 1500);
  }
});

loadData();
