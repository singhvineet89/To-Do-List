const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const categorySelect = document.getElementById("category");
const counter = document.getElementById("task-counter");
const darkToggle = document.getElementById("toggle-dark");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

function addTask() {
    if (inputBox.value === '') {
        alert("TextBox cannot be empty!");
    } else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;

        // category badge
        let category = categorySelect.value;
        let badge = document.createElement("span");
        badge.classList.add("badge", category);
        badge.textContent = category;
        li.setAttribute("data-category", category);
        li.appendChild(badge);

        // delete cross
        let span = document.createElement("span");
        span.classList.add("delete");
        span.innerHTML = "\u00d7";
        li.appendChild(span);

        listContainer.appendChild(li);

        enableDragAndDrop(); // ✅ Make new tasks draggable
    }
    inputBox.value = "";
    saveData();
    updateCounter();
}


// Toggle check & delete task
listContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        saveData();
        updateCounter();
    } else if (e.target.tagName === "SPAN" && !e.target.classList.contains("badge")) {
        e.target.parentElement.remove();
        saveData();
        updateCounter();
    }
}, false);

function filterTasks() {
    const searchText = searchInput.value.toLowerCase();
    const category = filterCategory.value;

    let tasks = listContainer.getElementsByTagName("li");

    Array.from(tasks).forEach(task => {
        let taskText = task.firstChild.textContent.toLowerCase(); // task text only

        let taskCategory = task.getAttribute("data-category");

        let matchesSearch = taskText.includes(searchText);
        let matchesCategory = (category === "all" || taskCategory === category);

        if (matchesSearch && matchesCategory) {
            task.style.display = "flex"; // show task
        } else {
            task.style.display = "none"; // hide task
        }
    });
}
function enableDragAndDrop() {
    const tasks = document.querySelectorAll("#list-container li");
    tasks.forEach(task => {
        task.setAttribute("draggable", "true");

        task.addEventListener("dragstart", () => {
            task.classList.add("dragging");
        });

        task.addEventListener("dragend", () => {
            task.classList.remove("dragging");
            saveData(); // Save new order
        });
    });

    listContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(listContainer, e.clientY);
        if (afterElement == null) {
            listContainer.appendChild(dragging);
        } else {
            listContainer.insertBefore(dragging, afterElement);
        }
    });
}

// Helper function to find correct position
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Event listeners
searchInput.addEventListener("input", filterTasks);
filterCategory.addEventListener("change", filterTasks);

// Save tasks + theme (match CSS: body.dark)
function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);

    const currentMode = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", currentMode);
}

// Load tasks + theme
function showTask() {
    listContainer.innerHTML = localStorage.getItem("data") || "";

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
}

// Task counter
function updateCounter() {
    const total = listContainer.querySelectorAll("li").length;
    const completed = listContainer.querySelectorAll("li.checked").length;
    counter.innerText = `${completed}/${total} completed`;
}

// Dark Mode toggle (match CSS: body.dark)
darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    darkToggle.textContent = document.body.classList.contains("dark")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
    saveData(); // persist immediately
});

// Init
showTask();
