import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://vesahiwbpxwokndexbyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2FoaXdicHh3b2tuZGV4YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTQxNDUsImV4cCI6MjA2NjM3MDE0NX0.FDyPHokVbyQfOZ8R4elOpv2negK0yw0Zf-rd_IwdLkE'
);

const validUsers = { "admin": "1234", "admin2": "abcd" };
const loginModal = document.getElementById("loginModal");
const mainContent = document.getElementById("mainContent");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const requestsTableBody = document.getElementById("requestsTableBody");

loginBtn.onclick = () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  if (validUsers[user] && validUsers[user] === pass) {
    loginModal.style.display = "none";
    mainContent.style.display = "block";
    loadRequests();
  } else {
    loginError.textContent = "اسم المستخدم أو كلمة المرور غير صحيحة";
  }
};

async function loadRequests() {
  const { data, error } = await supabase
    .from('subscriptionRequests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    requestsTableBody.innerHTML = `<tr><td colspan="9" style="color:red;">خطأ في تحميل الطلبات: ${error.message}</td></tr>`;
    return;
  }

  requestsTableBody.innerHTML = "";

  data.forEach(request => {
    const dateObj = request.created_at ? new Date(request.created_at) : new Date();
    const dateStr = dateObj.toLocaleString("ar-EG");

    const statusClass =
      request.status === "pending" ? "status-pending" :
      request.status === "accepted" ? "status-accepted" :
      "status-rejected";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${request.fullName || ""}</td>
      <td>${request.email || ""}</td>
      <td>${request.specialization || ""}</td>
      <td>${request.bio || ""}</td>
      <td>${request.username || "-"}</td>
      <td>${request.password || "-"}</td>
      <td>${dateStr}</td>
      <td class="${statusClass}">${request.status || "غير محدد"}</td>
      <td>
        <button class="btn-accept">قبول</button>
        <button class="btn-reject">رفض</button>
      </td>
    `;

    const btnAccept = row.querySelector(".btn-accept");
    const btnReject = row.querySelector(".btn-reject");

    btnAccept.onclick = async () => {
      const uid = request.username?.trim();
      if (!uid) return alert("اسم المستخدم غير صالح.");

      const { error: errUpdate } = await supabase
        .from('subscriptionRequests')
        .update({ status: "accepted" })
        .eq('id', request.id);

      if (errUpdate) return alert("خطأ أثناء تحديث حالة الطلب: " + errUpdate.message);

      const researcherData = {
        name: request.fullName || "",
        email: request.email || "",
        username: uid,
        password: request.password || "",
        specialization: request.specialization || "",
        bio: request.bio || "",
        photo: "images/default.png",
        created_at: new Date().toISOString()
      };

      const { error: errInsert } = await supabase
        .from('researchers')
        .upsert([researcherData], {
          onConflict: ['username']
        });

      if (errInsert) return alert("خطأ أثناء إضافة الباحث: " + errInsert.message);

      alert("✅ تم قبول الطلب وإضافة الباحث بنجاح.");
      loadRequests();
    };

    btnReject.onclick = async () => {
      const { error: errReject } = await supabase
        .from('subscriptionRequests')
        .update({ status: "rejected" })
        .eq('id', request.id);

      if (errReject) {
        alert("خطأ أثناء رفض الطلب: " + errReject.message);
        return;
      }
      loadRequests();
    };

    requestsTableBody.appendChild(row);
  });
}
