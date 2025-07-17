import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vesahiwbpxwokndexbyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2FoaXdicHh3b2tuZGV4YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTQxNDUsImV4cCI6MjA2NjM3MDE0NX0.FDyPHokVbyQfOZ8R4elOpv2negK0yw0Zf-rd_IwdLkE';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentCheckType = 'edit';

document.getElementById('editBtn').onclick = () => {
  currentCheckType = 'edit';
  document.getElementById('editModal').style.display = 'flex';
};

document.getElementById('cancelEdit').onclick = () => {
  document.getElementById('editModal').style.display = 'none';
};

document.getElementById('confirmEdit').onclick = async () => {
  const username = document.getElementById('usernameEdit').value.trim();
  const password = document.getElementById('passwordEdit').value.trim();
  const msgEl = document.getElementById('editMsg');

  if (!username || !password) {
    msgEl.innerText = 'يرجى إدخال اسم المستخدم وكلمة المرور.';
    return;
  }

  const { data, error } = await supabase
    .from('subscriptionRequests')
    .select('*')
    .eq('username', username)
    .eq('password', password);

  if (error || !data || data.length === 0) {
    msgEl.innerText = 'بيانات الدخول غير صحيحة.';
    return;
  }

  localStorage.setItem('selectedResearcherId', username);
  msgEl.innerText = 'تم التحقق. جاري التحويل...';

  setTimeout(() => {
    document.getElementById('editModal').style.display = 'none';

    if (currentCheckType === 'edit') {
      window.location.href = `/Edit?username=${encodeURIComponent(username)}`;
    } else if (currentCheckType === 'change-photo') {
      alert('✅ تم التحقق. يمكنك الآن رفع صورة جديدة.');
      document.getElementById('fileInput')?.click(); // يفتح اختيار الصورة
    }
  }, 800);

};

async function loadResearcherData() {
  const params = new URLSearchParams(window.location.search);
  const username = params.get("username");

  if (!username) {
    alert("لم يتم تحديد اسم المستخدم.");
    return;
  }

  try {
    const { data, error } = await supabase
      .from('researchers')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      alert("تعذر تحميل بيانات الباحث.");
      console.error(error);
      return;
    }

    document.getElementById('name').innerText = data.name || '';
    document.getElementById('bio').innerText = data.bio || '';
    document.getElementById('skills').innerText = data.skills || '';
    document.getElementById('photo').src = data.photo || 'images/default.png';

    document.getElementById('name_ar').innerText = data.name_ar || '';
    document.getElementById('name_en').innerText = data.name_en || '';
    document.getElementById('birthdate').innerText = data.birthdate || '';
    document.getElementById('academic_title').innerText = data.academic_title || '';
    document.getElementById('degree').innerText = data.degree || '';
    document.getElementById('general_specialization').innerText = data.general_specialization || '';
    document.getElementById('specific_specialization').innerText = data.specific_specialization || '';
    document.getElementById('others').innerText = data.others || '';

    function fillTable(dataArray, tableId, cols) {
      const tbody = document.getElementById(tableId);
      if (!tbody || !Array.isArray(dataArray)) return;
      tbody.innerHTML = '';
      dataArray.forEach(item => {
        const row = document.createElement('tr');
        cols.forEach(col => {
          const td = document.createElement('td');
          td.innerText = item[col] || '';
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
    }

    fillTable(data.education, 'eduBody', ['certificate', 'university', 'faculty', 'country', 'year']);
    fillTable(data.titles, 'titlesBody', ['title', 'date']);
    fillTable(data.certificates, 'certificatesBody', ['certificate', 'date', 'description']);
    fillTable(data.students, 'studentsBody', ['name', 'date', 'description']);
    fillTable(data.positions, 'positionsBody', ['position', 'from', 'to']);
    fillTable(data.awards, 'awardsBody', ['name', 'description', 'date']);

    // روابط الباحث
    const linksList = document.getElementById('linksList');
    linksList.innerHTML = '';
    let orcidId = null;
    (data.links || []).forEach(link => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.type || 'رابط غير معرف'}</a>`;
      linksList.appendChild(li);

      if ((link.type || '').toLowerCase().includes('orcid')) {
        const match = link.url.match(/orcid\.org\/([\d\-X]+)/);
        if (match) orcidId = match[1];
      }
    });

    document.getElementById('conferences').innerText = (data.conferences || []).length;
    document.getElementById('workshops').innerText = (data.workshops || []).length;
    document.getElementById('books').innerText = (data.books || []).length;
    document.getElementById('patents').innerText = (data.patents || []).length;
    document.getElementById('courses').innerText = (data.courses || []).length;

    document.getElementById('numPubsGS').innerText = data.numPubsGS || 0;
    document.getElementById('numCitesGS').innerText = data.numCitesGS || 0;
    document.getElementById('hIndexGS').innerText = data.hIndexGS || 0;

    document.getElementById('numPubsScopus').innerText = data.numPubsScopus || 0;
    document.getElementById('numCitesScopus').innerText = data.numCitesScopus || 0;
    document.getElementById('hIndexScopus').innerText = data.hIndexScopus || 0;

    drawStatsChart({
      hIndexGS: data.hIndexGS || 0,
      numCitesGS: data.numCitesGS || 0,
      numPubsGS: data.numPubsGS || 0,
      hIndexScopus: data.hIndexScopus || 0,
      numCitesScopus: data.numCitesScopus || 0,
      numPubsScopus: data.numPubsScopus || 0,
    });

    // ✅ إذا وُجد رابط ORCID يتم رسم الرسم البياني له
    if (orcidId) {
      fetchOrcidWorks(orcidId).then(worksData => {
        if (worksData) {
          const yearsCount = processWorksData(worksData);
          drawOrcidChart(yearsCount);
        }
      });
    }

  } catch (error) {
    alert("حدث خطأ أثناء تحميل البيانات: " + error.message);
    console.error(error);
  }
}

function drawStatsChart(data) {
  const ctx = document.getElementById('statsChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['H-Index', 'عدد الاستشهادات', 'عدد البحوث'],
      datasets: [
        {
          label: 'Google Scholar',
          data: [
            data.hIndexGS,
            data.numCitesGS,
            data.numPubsGS
          ],
          backgroundColor: 'rgba(33, 150, 243, 0.7)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1
        },
        {
          label: 'Scopus',
          data: [
            data.hIndexScopus,
            data.numCitesScopus,
            data.numPubsScopus
          ],
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'القيمة' }
        },
        x: {
          title: { display: true, text: 'المؤشر' }
        }
      }
    }
  });
}

// 🎯 دوال ORCID
async function fetchOrcidWorks(orcidId) {
  const url = `https://pub.orcid.org/v3.0/${orcidId}/works`;
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("ORCID Fetch Error:", err);
    return null;
  }
}

function processWorksData(worksData) {
  const yearsCount = {};
  const groups = worksData.group || [];
  groups.forEach(group => {
    (group['work-summary'] || []).forEach(summary => {
      const year = summary?.['publication-date']?.year?.value;
      if (year) {
        yearsCount[year] = (yearsCount[year] || 0) + 1;
      }
    });
  });
  return yearsCount;
}

function drawOrcidChart(yearsCount) {
  const ctx = document.getElementById('orcidChart').getContext('2d');
  const labels = Object.keys(yearsCount).sort();
  const data = labels.map(y => yearsCount[y]);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'عدد الأبحاث حسب السنة',
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'عدد الأبحاث' }
        },
        x: {
          title: { display: true, text: 'السنة' }
        }
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', loadResearcherData);



// ⬇️ أضف هذا هنا في نهاية الملف
document.getElementById('photo').addEventListener('click', () => {
  currentCheckType = 'change-photo'; // 👈 هذا السطر يحل المشكلة
  document.getElementById('editModal').style.display = 'flex';
});




document.addEventListener('change', async (event) => {
  if (event.target.id !== 'fileInput') return;

  const file = event.target.files[0];
  if (!file) return;

  const username = localStorage.getItem('selectedResearcherId');
  if (!username) return alert('اسم المستخدم غير موجود.');

  if (file.size > 0.5 * 1024 * 1024) {
    alert('🚫 حجم الصورة كبير جدًا. يرجى رفع صورة لا تتجاوز 0.5 ميغابايت.');
    return;
  }

  const originalSizeKB = (file.size / 1024).toFixed(2);
  const img = new Image();
  const reader = new FileReader();

  reader.onload = async (event) => {
    img.src = event.target.result;
  };

  img.onload = async () => {
    if (img.width < 150 || img.height < 150) {
      alert('🚫 أبعاد الصورة صغيرة جدًا. يجب أن تكون على الأقل 150x150 بكسل.');
      return;
    }

    const MAX_SIZE = 400;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return alert('تعذر ضغط الصورة.');

      const compressedSizeKB = (blob.size / 1024).toFixed(2);
      const sizeDifference = (originalSizeKB - compressedSizeKB).toFixed(2);
      const reductionPercent = ((sizeDifference / originalSizeKB) * 100).toFixed(1);

      alert(
        `📏 الحجم الأصلي: ${originalSizeKB} KB\n` +
        `📉 بعد الضغط: ${compressedSizeKB} KB\n` +
        `🔻 الفرق: ${sizeDifference} KB (${reductionPercent}%)`
      );

      if (reductionPercent < 20) {
        alert('⚠️ لم يتم تقليل حجم الصورة بنسبة كافية، لن يتم رفعها.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${username}/profile.${fileExt}`;

      try {
        await supabase.storage.from('researchers-photos').remove([filePath]).catch(() => {});

        const { data, error } = await supabase.storage
          .from('researchers-photos')
          .upload(filePath, blob, { upsert: true });

        if (error) throw error;

        const { data: urlData, error: urlError } = await supabase.storage
          .from('researchers-photos')
          .getPublicUrl(filePath);

        if (urlError) throw urlError;

        const newUrl = urlData.publicUrl + `?t=${Date.now()}`;

        const { error: updateError } = await supabase
          .from('researchers')
          .update({ photo: newUrl })
          .eq('username', username);

        if (updateError) throw updateError;

        document.getElementById('photo').src = newUrl;

        alert('✅ تم رفع وتحديث الصورة بنجاح.');

      } catch (err) {
        alert('❌ خطأ أثناء رفع الصورة: ' + err.message);
        console.error('Upload error:', err);
      }
    }, 'image/jpeg', 0.85);
  };

  reader.readAsDataURL(file);
});





