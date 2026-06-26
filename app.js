// ── App Logic ───────────────────────────────────────────────────────────────

let currentSection = 'dashboard';
let editingRoll = null;       // null = add mode, string = edit mode
let pendingDeleteRoll = null; // roll to delete after confirm

// ── Navigation ──────────────────────────────────────────────────────────────

function navigate(section) {
  document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  document.getElementById(`section-${section}`).classList.remove('hidden');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

  currentSection = section;

  if (section === 'dashboard') renderDashboard();
  if (section === 'students') renderStudents();
  if (section === 'add') openAddForm();
}

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigate(link.dataset.section);
  });
});

// ── Dashboard ───────────────────────────────────────────────────────────────

function renderDashboard() {
  const students = getAllStudents();

  document.getElementById('stat-total').textContent = students.length;

  if (students.length) {
    const avg = Math.round(students.reduce((s, x) => s + Number(x.age), 0) / students.length);
    document.getElementById('stat-avg').textContent = avg;
    document.getElementById('stat-sections').textContent = new Set(students.map(s => s.section)).size;
    document.getElementById('stat-latest').textContent = students[students.length - 1].roll;
  } else {
    document.getElementById('stat-avg').textContent = '—';
    document.getElementById('stat-sections').textContent = '0';
    document.getElementById('stat-latest').textContent = '—';
  }

  const recent = students.slice(-5).reverse();
  const tbody = document.getElementById('dashboard-tbody');
  tbody.innerHTML = recent.length
    ? recent.map(s => rowHTML(s, false)).join('')
    : `<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:#9CA3AF;">No students yet. <a href="#" onclick="navigate('add');return false;">Add one</a></td></tr>`;
}

// ── Students List ────────────────────────────────────────────────────────────

function renderStudents() {
  const q = document.getElementById('search-input')?.value.trim().toLowerCase() || '';
  const sec = document.getElementById('filter-section')?.value || '';
  let list = getAllStudents();

  if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q));
  if (sec) list = list.filter(s => s.section === sec);

  const tbody = document.getElementById('students-tbody');
  const empty = document.getElementById('no-students');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = list.map(s => rowHTML(s, true)).join('');
  }
}

function rowHTML(s, showActions) {
  const [bg, fg] = avatarColor(s.name);
  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const actions = showActions ? `
    <td>
      <div class="action-btns">
        <button class="btn-icon" onclick="openEditForm('${s.roll}')" title="Edit">
          <i class="ti ti-edit"></i>
        </button>
        <button class="btn-icon danger" onclick="askDelete('${s.roll}')" title="Delete">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </td>` : '';
  return `
    <tr>
      <td><strong>${s.roll}</strong></td>
      <td>
        <div class="name-cell">
          <div class="avatar" style="background:${bg};color:${fg}">${initials}</div>
          ${s.name}
        </div>
      </td>
      <td>${s.age}</td>
      <td><span class="badge badge-${s.section}">${s.section}</span></td>
      ${actions}
    </tr>`;
}

// ── Avatar color ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ['#EFF6FF', '#1E40AF'], ['#F0FDF4', '#166534'],
  ['#F5F3FF', '#5B21B6'], ['#FFF7ED', '#C2410C'],
  ['#FDF4FF', '#86198F'], ['#ECFDF5', '#065F46'],
];

function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ── Add / Edit Form ──────────────────────────────────────────────────────────

function openAddForm() {
  editingRoll = null;
  document.getElementById('form-title').textContent = 'Add Student';
  document.getElementById('f-roll').value = '';
  document.getElementById('f-roll').disabled = false;
  document.getElementById('f-name').value = '';
  document.getElementById('f-age').value = '';
  document.getElementById('f-section').value = 'A';
  document.getElementById('save-btn').textContent = 'Save Student';
  clearErrors();
}

function openEditForm(roll) {
  const s = getStudentByRoll(roll);
  if (!s) return;
  navigate('add');
  editingRoll = roll;
  document.getElementById('form-title').textContent = 'Edit Student';
  document.getElementById('f-roll').value = s.roll;
  document.getElementById('f-roll').disabled = true;
  document.getElementById('f-name').value = s.name;
  document.getElementById('f-age').value = s.age;
  document.getElementById('f-section').value = s.section;
  document.getElementById('save-btn').textContent = 'Update Student';
  clearErrors();
}

function saveStudent() {
  const roll = document.getElementById('f-roll').value.trim();
  const name = document.getElementById('f-name').value.trim();
  const age  = parseInt(document.getElementById('f-age').value);
  const section = document.getElementById('f-section').value;
  let valid = true;

  clearErrors();

  if (!editingRoll) {
    if (!roll) {
      showError('err-roll', 'Roll number is required.'); valid = false;
    } else if (getStudentByRoll(roll)) {
      showError('err-roll', 'This roll number already exists.'); valid = false;
    }
  }

  if (!name) { showError('err-name', 'Name is required.'); valid = false; }
  if (!age || age < 5 || age > 30) { showError('err-age', 'Enter a valid age between 5 and 30.'); valid = false; }

  if (!valid) return;

  if (editingRoll) {
    updateStudent(editingRoll, { name, age, section });
  } else {
    addStudent({ roll, name, age, section });
  }

  navigate('students');
}

function clearErrors() {
  ['err-roll', 'err-name', 'err-age'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.add('hidden');
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Delete ───────────────────────────────────────────────────────────────────

function askDelete(roll) {
  pendingDeleteRoll = roll;
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  pendingDeleteRoll = null;
  document.getElementById('modal-backdrop').classList.add('hidden');
}

function confirmDelete() {
  if (pendingDeleteRoll) deleteStudentByRoll(pendingDeleteRoll);
  closeModal();
  renderStudents();
}

// Close modal on backdrop click
document.getElementById('modal-backdrop').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── Init ─────────────────────────────────────────────────────────────────────

document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

renderDashboard();