/* Elements */
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const categorySelect = document.getElementById("category");
const counter = document.getElementById("task-counter");
const darkToggle = document.getElementById("toggle-dark");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

/* Helper: get visible task text (robust to nodes and badges) */
function getTaskText(li) {
  // Prefer the first non-empty text node
  for (const node of li.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent.trim();
      if (t) return t;
    }
  }
  // fallback: innerText minus badge text and cross
  const badge = li.querySelector('.badge');
  let txt = (li.innerText || '').trim();
  if (badge) txt = txt.replace(badge.innerText, '').trim();
  txt = txt.replace('\u00d7', '').trim();
  return txt;
}

/* Add task (minimal changes: removed delete cross) */
function addTask() {
  const value = inputBox.value.trim();
  if (!value) {
    alert("TextBox cannot be empty!");
    return;
  }

  const li = document.createElement("li");
  // place task text as text node (keeps structure predictable)
  li.appendChild(document.createTextNode(value));

  // category badge
  const category = categorySelect.value;
  li.setAttribute("data-category", category);

  const badge = document.createElement("span");
  badge.classList.add("badge", category);
  badge.textContent = category;
  li.appendChild(badge);

  listContainer.appendChild(li);

  // make new item draggable
  enableDragAndDrop();

  inputBox.value = "";
  saveData();
  updateCounter();
  filterTasks();
}

/* Click toggles complete (ignore clicks on badges) */
listContainer.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li || !listContainer.contains(li)) return;

  // Ignore clicks on badge
  if (e.target.closest(".badge")) return;

  // Toggle checked
  li.classList.toggle("checked");
  saveData();
  updateCounter();
  filterTasks();
});

/* Double-click deletes with SweetAlert confirmation */
listContainer.addEventListener("dblclick", function (e) {
  const li = e.target.closest("li");
  if (!li || !listContainer.contains(li)) return;

  // Ignore dblclick on badge
  if (e.target.closest(".badge")) return;

  const text = getTaskText(li);

  // Use SweetAlert2 for confirmation (CDN loaded in HTML)
  Swal.fire({
    title: 'Delete task?',
    text: text || 'This task',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      // animate then remove
      li.classList.add('removing');
      setTimeout(() => {
        if (li.parentElement) li.remove();
        saveData();
        updateCounter();
        filterTasks();
      }, 280); // match your CSS transition timing
    }
  });
});

/* Filter / Search */
function filterTasks() {
  const searchText = (searchInput?.value || '').toLowerCase();
  const category = (filterCategory?.value || 'all');

  const tasks = listContainer.getElementsByTagName("li");
  Array.from(tasks).forEach(task => {
    const text = (getTaskText(task) || '').toLowerCase();
    const taskCategory = task.getAttribute("data-category") || '';
    const matchesSearch = text.includes(searchText);
    const matchesCategory = (category === "all" || taskCategory === category);
    task.style.display = (matchesSearch && matchesCategory) ? "flex" : "none";
  });
}
if (searchInput) searchInput.addEventListener("input", filterTasks);
if (filterCategory) filterCategory.addEventListener("change", filterTasks);

/* Drag & Drop (kept your existing logic, only minor robustness) */
function enableDragAndDrop() {
  const tasks = document.querySelectorAll("#list-container li");
  tasks.forEach(task => {
    task.setAttribute("draggable", "true");

    // remove duplicate listeners if they exist (safe)
    task.removeEventListener("dragstart", onDragStart);
    task.removeEventListener("dragend", onDragEnd);

    task.addEventListener("dragstart", onDragStart);
    task.addEventListener("dragend", onDragEnd);
  });

  if (!listContainer._dragOverAttached) {
    listContainer.addEventListener("dragover", onDragOver);
    listContainer._dragOverAttached = true;
  }
}

function onDragStart(e) { this.classList.add("dragging"); }
function onDragEnd(e) { this.classList.remove("dragging"); saveData(); }

function onDragOver(e) {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;
  const afterElement = getDragAfterElement(listContainer, e.clientY);
  if (afterElement == null) listContainer.appendChild(dragging);
  else listContainer.insertBefore(dragging, afterElement);
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* Persistence */
function saveData() {
  localStorage.setItem("data", listContainer.innerHTML);
  const currentMode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", currentMode);
}

function showTask() {
  listContainer.innerHTML = localStorage.getItem("data") || "";

  // Normalize restored items: remove old delete spans and ensure data-category exists
  Array.from(listContainer.querySelectorAll("li")).forEach(li => {
    // remove any leftover delete elements from previous versions
    li.querySelectorAll(".delete").forEach(d => d.remove());

    // ensure data-category is set (use badge text if available)
    if (!li.getAttribute("data-category")) {
      const badge = li.querySelector(".badge");
      if (badge) li.setAttribute("data-category", badge.textContent.trim().toLowerCase());
    }

    // normalize badge class to lowercase
    const badge = li.querySelector(".badge");
    if (badge) {
      const cat = badge.textContent.trim().toLowerCase();
      badge.classList.add(cat);
    }
  });

  // restore theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    darkToggle.textContent = "☀️ Light Mode";
  } else {
    document.body.classList.remove("dark");
    darkToggle.textContent = "🌙 Dark Mode";
  }

  updateCounter();
  enableDragAndDrop();
  filterTasks();
}

/* UI helpers */
function updateCounter() {
  const total = listContainer.querySelectorAll("li").length;
  const completed = listContainer.querySelectorAll("li.checked").length;
  counter.innerText = `${completed}/${total} completed`;
}

/* Theme toggle */
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  darkToggle.textContent = document.body.classList.contains("dark")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
  saveData();
});

/* Init */
showTask();
