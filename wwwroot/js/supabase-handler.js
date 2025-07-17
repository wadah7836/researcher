import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://vesahiwbpxwokndexbyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2FoaXdicHh3b2tuZGV4YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTQxNDUsImV4cCI6MjA2NjM3MDE0NX0.FDyPHokVbyQfOZ8R4elOpv2negK0yw0Zf-rd_IwdLkE';
const supabase = createClient(supabaseUrl, supabaseKey);

// نافذة الاشتراك
document.getElementById("requestIconWrapper")?.addEventListener("click", () => {
  document.getElementById("requestModal").style.display = "flex";
});
document.getElementById("closeModalBtn")?.addEventListener("click", () => {
  document.getElementById("requestModal").style.display = "none";
});

// التحقق من تفرد اسم المستخدم
async function isUsernameUnique(username) {
  let { data: subReqs, error: err1 } = await supabase
    .from('subscriptionRequests')
    .select('username')
    .eq('username', username);
  if (err1 || subReqs.length > 0) return false;

  let { data: researchers, error: err2 } = await supabase
    .from('researchers')
    .select('username')
    .eq('username', username);
  if (err2 || researchers.length > 0) return false;

  return true;
}

// إرسال الطلب
window.sendSubscriptionRequest = async function () {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("emailRequest").value.trim();
  const specialization = document.getElementById("specialization").value.trim();
  const username = document.getElementById("usernameRequest").value.trim();
  const password = document.getElementById("passwordRequest").value.trim();
  const confirmPassword = document.getElementById("confirmPasswordRequest").value.trim();
  const bio = document.getElementById("bioRequest").value.trim();
  const msg = document.getElementById("requestMessage");

  if (!fullName || !email || !specialization || !username || !password) {
    msg.style.color = "red";
    msg.textContent = "يرجى ملء جميع الحقول الإلزامية.";
    return;
  }

  const usernamePattern = /^[a-z0-9]{3,20}$/;
  if (!usernamePattern.test(username)) {
    msg.style.color = "red";
    msg.textContent = "اسم المستخدم غير صالح.";
    return;
  }

  if (!(await isUsernameUnique(username))) {
    msg.style.color = "red";
    msg.textContent = "اسم المستخدم موجود مسبقًا.";
    return;
  }

  if (password !== confirmPassword) {
    msg.style.color = "red";
    msg.textContent = "كلمة المرور وتأكيدها غير متطابقين.";
    return;
  }

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPattern.test(password)) {
    msg.style.color = "red";
    msg.textContent = "كلمة المرور ضعيفة.";
    return;
  }

  const { error } = await supabase
    .from('subscriptionRequests')
    .insert([{ fullName, email, specialization, username, password, bio, status: 'pending', created_at: new Date() }]);

  if (error) {
    msg.style.color = "red";
    msg.textContent = "خطأ أثناء إرسال الطلب: " + error.message;
  } else {
    msg.style.color = "green";
    msg.textContent = "تم إرسال الطلب بنجاح.";

    // عرض البطاقة في الصفحة
    const newResearcherCard = document.createElement("div");
    newResearcherCard.className = "card";
    newResearcherCard.innerHTML = `
      <h3>${fullName}</h3>
      <p><strong>مكان العمل:</strong> ${specialization}</p>
      <p><strong>البريد الإلكتروني:</strong> ${email}</p>
      <p>${bio || ''}</p>
    `;
    researcherCards.appendChild(newResearcherCard);

    document.querySelectorAll("#requestModalContent input, textarea").forEach(i => i.value = "");
    setTimeout(() => {
      document.getElementById("requestModal").style.display = "none";
      msg.textContent = "";
    }, 3000);
  }
};

// تحميل الباحثين من جدول researchers
const researcherCards = document.getElementById("researcherCards");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
let researchersList = [];

async function fetchResearchers() {
  const { data, error } = await supabase
    .from('researchers')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error("Error fetching researchers:", error);
    researcherCards.innerHTML = `<p style="color:red;">حدث خطأ أثناء جلب الباحثين</p>`;
    return;
  }
  researchersList = data;
  displayResearchers(researchersList);
}

// عرض الباحثين
function displayResearchers(list) {
  if (!list || list.length === 0) {
    researcherCards.innerHTML = `<p>لا يوجد باحثون لعرضهم.</p>`;
    return;
  }

  researcherCards.innerHTML = list.map(r => `
    <div class="card" onclick="location.href='Profile?username=${encodeURIComponent(r.username)}'">
      <img src="${r.photo || 'images/default.png'}" alt="صورة الباحث" class="researcher-photo"/>
      <h3>${r.name}</h3>
      <p><strong>مكان العمل:</strong> ${r.specialization}</p>
    </div>
  `).join('');
}



// البحث بالاسم من جدول الباحثين
searchButton?.addEventListener('click', () => {
  const term = searchInput.value.trim();
  if (!term) {
    displayResearchers(researchersList);
    return;
  }
  const filtered = researchersList.filter(r =>
    r.name.toLowerCase().includes(term.toLowerCase())
  );
  displayResearchers(filtered);
});

// تحميل عند البدء
fetchResearchers();
