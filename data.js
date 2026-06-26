// ── Data Layer ──────────────────────────────────────────────────────────────
// All student data is stored in localStorage so it persists across sessions.

const STORAGE_KEY = 'sms_students';

const DEFAULT_STUDENTS = [
  { roll: '101', name: 'Aanya Sharma',  age: 18, section: 'A' },
  { roll: '102', name: 'Rohan Mehta',   age: 19, section: 'B' },
  { roll: '103', name: 'Priya Singh',   age: 17, section: 'A' },
  { roll: '104', name: 'Arjun Verma',   age: 20, section: 'C' },
  { roll: '105', name: 'Neha Gupta',    age: 18, section: 'B' },
];

function loadStudents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveStudents(DEFAULT_STUDENTS);
    return DEFAULT_STUDENTS;
  }
  return JSON.parse(raw);
}

function saveStudents(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getAllStudents() {
  return loadStudents();
}

function getStudentByRoll(roll) {
  return loadStudents().find(s => s.roll === roll) || null;
}

function addStudent(student) {
  const list = loadStudents();
  if (list.some(s => s.roll === student.roll)) return false; // duplicate
  list.push(student);
  saveStudents(list);
  return true;
}

function updateStudent(roll, updated) {
  const list = loadStudents();
  const idx = list.findIndex(s => s.roll === roll);
  if (idx === -1) return false;
  list[idx] = { roll, ...updated };
  saveStudents(list);
  return true;
}

function deleteStudentByRoll(roll) {
  const list = loadStudents().filter(s => s.roll !== roll);
  saveStudents(list);
}