import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://vesahiwbpxwokndexbyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2FoaXdicHh3b2tuZGV4YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTQxNDUsImV4cCI6MjA2NjM3MDE0NX0.FDyPHokVbyQfOZ8R4elOpv2negK0yw0Zf-rd_IwdLkE'
);

const fieldSelect = document.getElementById('fieldSelect');
const valueSelect = document.getElementById('valueSelect');
const workplaceSelect = document.getElementById('workplaceSelect');
const resultsBox = document.getElementById('results');
const workStats = document.getElementById('workStats');
const totalCount = document.getElementById('totalCount');

fieldSelect.addEventListener('change', async () => {
  const field = fieldSelect.value;
  valueSelect.innerHTML = '<option value="">تحميل...</option>';
  if (!field) {
    valueSelect.innerHTML = '<option value="">اختر الحقل أولاً</option>';
    return;
  }

  const { data, error } = await supabase.from('researchers').select(field);
  if (error) {
    valueSelect.innerHTML = '<option value="">خطأ في جلب البيانات</option>';
    console.error(error);
    return;
  }

  const uniqueValues = [...new Set(data.map(item => item[field]).filter(Boolean))];
  valueSelect.innerHTML = '<option value="">اختر القيمة</option>';
  uniqueValues.forEach(val => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    valueSelect.appendChild(opt);
  });
});

document.getElementById('searchBtn').addEventListener('click', search);

async function search() {
  const field = fieldSelect.value;
  const keyword = valueSelect.value.trim().toLowerCase();
  const workplace = workplaceSelect.value;
  resultsBox.innerHTML = "جارٍ البحث...";

  const { data, error } = await supabase.from("researchers").select("*");
  if (error) {
    resultsBox.innerHTML = `<p style="color:red;">خطأ في جلب البيانات</p>`;
    return;
  }

  let filtered = data;

  if (workplace) {
    filtered = filtered.filter(r => r.specialization === workplace);
  }

  if (field && keyword) {
    filtered = filtered.filter(r => r[field]?.toString().toLowerCase() === keyword);
  }

  if (filtered.length === 0) {
    resultsBox.innerHTML = "<p>لا توجد نتائج مطابقة.</p>";
    return;
  }

  resultsBox.innerHTML = `<h3>تم العثور على ${filtered.length} باحث:</h3>`;
  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    const uid = encodeURIComponent(r.username || '');
    card.innerHTML = `
      <img src="${r.photo?.trim() || 'images/default.png'}" />
      <h3>${r.name || 'بدون اسم'}</h3>
      <p><strong>اللقب العلمي:</strong> ${r.academic_title || '---'}</p>
      <p><strong>الشهادة:</strong> ${r.degree || '---'}</p>
      <p><strong>الاختصاص العام:</strong> ${r.general_specialization || '---'}</p>
      <p><strong>مكان العمل:</strong> ${r.specialization || '---'}</p>
    `;
    card.addEventListener('click', () => {
      if (uid) {
        localStorage.setItem("selectedResearcherId", uid);
        window.location.href = `profile?username=${uid}`;
      }
    });
    resultsBox.appendChild(card);
  });

  fieldSelect.dispatchEvent(new Event('change'));
}

async function loadWorkStats() {
  const { data, error } = await supabase.from("researchers").select("specialization, degree");
  if (error) return;

  totalCount.textContent = data.length;

  let phd = 0, master = 0, diploma = 0;
  const countMap = {};

  data.forEach(r => {
    const key = r.specialization || "غير محدد";
    countMap[key] = (countMap[key] || 0) + 1;

    const deg = (r.degree || "").toLowerCase();
    if (deg.includes("دكتور")) phd++;
    else if (deg.includes("ماجستير")) master++;
    else if (deg.includes("دبلوم")) diploma++;
  });

  document.getElementById('phdCount').textContent = phd;
  document.getElementById('masterCount').textContent = master;
  document.getElementById('diplomaCount').textContent = diploma;

  for (const place in countMap) {
    const opt = document.createElement('option');
    opt.value = place;
    opt.textContent = place;
    workplaceSelect.appendChild(opt);
  }

  const icons = ["fa-university", "fa-building", "fa-school", "fa-landmark", "fa-city", "fa-briefcase", "fa-users", "fa-flask"];
  let i = 0;

  workStats.innerHTML = "";
  for (const place in countMap) {
    const icon = icons[i % icons.length];
    workStats.innerHTML += `
      <div class="work-card" onclick="filterByWorkplace('${place}')">
        <i class="fas ${icon}"></i>
        <h4>${place}</h4>
        <span>${countMap[place]} باحث</span>
      </div>`;
    i++;
  }
}

window.filterByWorkplace = function (place) {
  workplaceSelect.value = place;
  valueSelect.value = "";
  fieldSelect.value = "";
  resultsBox.innerHTML = "";
  search();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

loadWorkStats();
