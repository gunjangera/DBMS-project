/* =====================================
   CAMPUSCORE - STUDENT MANAGEMENT SYSTEM
===================================== */

/* =====================================
   HELPER FUNCTIONS
===================================== */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


function load(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {
        console.error("Could not load data:", error);
        return fallback;
    }
}


function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    if (databaseReady && ["campuscore_users", "campuscore_students", "campuscore_teachers", "campuscore_reports", "campuscore_attendance"].includes(key)) {
        queueDatabaseSave();
    }
}

let databaseReady = false;
let databaseSaveTimer;

function queueDatabaseSave() {
    clearTimeout(databaseSaveTimer);
    databaseSaveTimer = setTimeout(async () => {
        try {
            const response = await fetch("/api/state", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ users, students, teachers, reports, attendance })
            });
            if (!response.ok) throw new Error("Database save failed");
        } catch (error) {
            console.error("Could not save to the database:", error);
            showToast("Database save failed. Keep the server running and try again.", "error");
        }
    }, 150);
}


function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function grade(marks) {
    if (marks >= 90) return "A+";
    if (marks >= 80) return "A";
    if (marks >= 70) return "B";
    if (marks >= 60) return "C";
    if (marks >= 50) return "D";

    return "F";
}


function average(numbers) {
    if (numbers.length === 0) {
        return 0;
    }

    return numbers.reduce((total, number) => total + number, 0)
        / numbers.length;
}


function showToast(message, type = "success") {
    const toast = $("#toast");

    toast.textContent = message;

    toast.classList.remove("error");

    if (type === "error") {
        toast.classList.add("error");
    }

    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


function showEmptyRow(tableId, columns, message) {
    const table = document.getElementById(tableId);

    table.innerHTML = `
        <tr>
            <td colspan="${columns}" class="empty-row">
                ${safe(message)}
            </td>
        </tr>
    `;
}


function searchMatch(record, query) {
    const text = Object.values(record)
        .join(" ")
        .toLowerCase();

    return text.includes(query.toLowerCase());
}


/* =====================================
   DEMO USERS
===================================== */

const DEFAULT_USERS = [
    {
        id: "ADMIN",
        password: "admin123",
        name: "Campus Administrator",
        email: "admin@example.com",
        role: "admin",
        department: "Administration",
    },

    {
        id: "TCH1001",
        password: "teacher123",
        name: "Dr. Neha Gupta",
        email: "neha@example.com",
        role: "teacher",
        department: "Computer Science",
        designation: "Assistant Professor",
        phone: "9876543210"
    },

    {
        id: "STU1001",
        password: "student123",
        name: "Aarav Sharma",
        email: "aarav@example.com",
        role: "student",
        department: "Computer Science",
        year: "2nd Year"
    },

    {
        id: "STU1002",
        password: "student123",
        name: "Priya Verma",
        email: "priya@example.com",
        role: "student",
        department: "Information Technology",
        year: "1st Year"
    },

    {
        id: "STU1003",
        password: "student123",
        name: "Rohan Singh",
        email: "rohan@example.com",
        role: "student",
        department: "Computer Science",
        year: "3rd Year"
    }
];


/* =====================================
   INITIAL DATA
===================================== */

let users = load("campuscore_users", DEFAULT_USERS);

let students = load("campuscore_students", [
    {
        id: "STU1001",
        name: "Aarav Sharma",
        email: "aarav@example.com",
        department: "Computer Science",
        year: "2nd Year"
    },

    {
        id: "STU1002",
        name: "Priya Verma",
        email: "priya@example.com",
        department: "Information Technology",
        year: "1st Year"
    },

    {
        id: "STU1003",
        name: "Rohan Singh",
        email: "rohan@example.com",
        department: "Computer Science",
        year: "3rd Year"
    }
]);


let teachers = load("campuscore_teachers", [
    {
        id: "TCH1001",
        name: "Dr. Neha Gupta",
        email: "neha@example.com",
        department: "Computer Science",
        designation: "Assistant Professor",
        phone: "9876543210"
    }
]);


let reports = load("campuscore_reports", [
    {
        id: 1,
        studentId: "STU1001",
        subject: "Data Structures",
        marks: 85
    },

    {
        id: 2,
        studentId: "STU1001",
        subject: "Database Systems",
        marks: 91
    },

    {
        id: 3,
        studentId: "STU1002",
        subject: "Programming",
        marks: 78
    }
]);


let attendance = load("campuscore_attendance", []);


let currentUser = load("campuscore_currentUser", null);


/* =====================================
   SAVE INITIAL DATA
===================================== */

save("campuscore_users", users);

save("campuscore_students", students);

save("campuscore_teachers", teachers);

save("campuscore_reports", reports);

save("campuscore_attendance", attendance);


/* =====================================
   PAGE TITLES
===================================== */

const pageTitles = {
    dashboard: "Dashboard",
    students: "Student Management",
    teachers: "Teacher Management",
    reports: "Reports & Grades",
    attendance: "Attendance Management",
    myAcademics: "My Academics",
    admin: "Administration",
    profile: "My Profile"
};


/* =====================================
   ROLE PERMISSIONS
===================================== */

function allowed(view) {
    if (!currentUser) {
        return false;
    }

    const role = currentUser.role;

    const permissions = {
        admin: [
            "dashboard",
            "students",
            "teachers",
            "reports",
            "attendance",
            "admin",
            "profile"
        ],

        teacher: [
            "dashboard",
            "students",
            "reports",
            "attendance",
            "profile"
        ],

        student: [
            "dashboard",
            "myAcademics",
            "profile"
        ]
    };

    return permissions[role]?.includes(view) ?? false;
}


/* =====================================
   LOGIN
===================================== */

$("#loginForm").addEventListener("submit", function (event) {

    event.preventDefault();

    const id = $("#loginId").value.trim().toUpperCase();

    const password = $("#loginPassword").value;

    const foundUser = users.find(user => {

        return user.id.toUpperCase() === id
            && user.password === password;

    });

    if (!foundUser) {

        $("#loginError").textContent =
            "Invalid user ID or password.";

        return;
    }

    currentUser = { ...foundUser };

    save("campuscore_currentUser", currentUser);

    $("#loginError").textContent = "";

    $("#loginForm").reset();

    startApplication();

});


/* =====================================
   LOGOUT
===================================== */

$("#logoutBtn").addEventListener("click", function () {

    currentUser = null;

    localStorage.removeItem("campuscore_currentUser");

    $("#app").classList.add("hidden");

    $("#loginPage").classList.remove("hidden");

    $("#sidebar").classList.remove("open");

    showToast("You have logged out successfully.");

});


/* =====================================
   START APPLICATION
===================================== */

function startApplication() {

    if (!currentUser) {
        return;
    }

    $("#loginPage").classList.add("hidden");

    $("#app").classList.remove("hidden");

    setupUser();

    renderAll();

    appViewHistory = ["dashboard"];
    appViewIndex = 0;
    history.replaceState(
        { campusCoreView: "dashboard" },
        "",
        window.location.href
    );
    navigate("dashboard");

}


/* =====================================
   USER SETUP
===================================== */

function setupUser() {

    const name = currentUser.name || "User";

    const firstLetter = name.charAt(0).toUpperCase();

    $("#sidebarUserName").textContent = name;

    $("#sidebarUserRole").textContent =
        currentUser.role.charAt(0).toUpperCase()
        + currentUser.role.slice(1);

    $("#sidebarAvatar").textContent = firstLetter;

    $("#topbarAvatar").textContent = firstLetter;

    $("#profileAvatar").textContent = firstLetter;

    $("#welcomeMessage").textContent = `Welcome back, ${name}!`;

    $("#profileName").textContent = name;

    $("#profileRole").textContent =
        currentUser.role.charAt(0).toUpperCase()
        + currentUser.role.slice(1);

    $("#profileId").textContent = currentUser.id;

    $("#profileEmail").textContent =
        currentUser.email || "Not provided";

    $("#profileDepartment").textContent =
        currentUser.department || "Not assigned";

    $("#adminCurrentRole").textContent =
        currentUser.role.charAt(0).toUpperCase()
        + currentUser.role.slice(1);


    $$(".nav-link").forEach(button => {

        const view = button.dataset.view;

        button.classList.remove("active");

        button.style.display = allowed(view) ? "flex" : "none";

    });


    $("#addStudentSection").classList.toggle(
        "hidden",
        !["admin", "teacher"].includes(currentUser.role)
    );

    $("#addTeacherSection").classList.toggle(
        "hidden",
        currentUser.role !== "admin"
    );

    $("#addReportSection").classList.toggle(
        "hidden",
        currentUser.role === "student"
    );

    $("#addAttendanceSection").classList.toggle(
        "hidden",
        currentUser.role === "student"
    );


    updateClock();

}

function updateClock() {
    $("#currentDate").textContent = new Date()
        .toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
}


/* =====================================
   NAVIGATION
===================================== */

$("#brandHome").addEventListener("click", function () {
    navigate("dashboard");
});

$("#topbarAvatar").addEventListener("click", function () {
    navigate("profile");
});

let appViewHistory = ["dashboard"];
let appViewIndex = 0;

function navigate(view, options = {}) {

    if (!allowed(view)) {
        return;
    }

    const currentSection = $(".view-section:not(.hidden)");
    const currentView = currentSection?.id.replace("View", "");

    if (currentView === view) {
        return;
    }

    if (!options.fromHistory) {
        appViewHistory = appViewHistory.slice(0, appViewIndex + 1);
        appViewHistory.push(view);
        appViewIndex = appViewHistory.length - 1;
        history.pushState(
            { campusCoreView: view },
            "",
            window.location.href
        );
    }

    $$(".view-section").forEach(section => {

        section.classList.add("hidden");
        section.classList.remove("slide-back");

    });


    const target = document.getElementById(`${view}View`);

    if (target) {
        target.classList.remove("hidden");

        if (options.direction === "back") {
            target.classList.add("slide-back");
            target.addEventListener("animationend", event => {
                if (event.target === target) {
                    target.classList.remove("slide-back");
                }
            }, { once: true });
        }
    }


    $$(".nav-link").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.view === view
        );

    });


    $("#pageTitle").textContent = pageTitles[view] || "CampusCore";

    $("#sidebar").classList.remove("open");

}


$$(".nav-link").forEach(button => {

    button.addEventListener("click", function () {

        navigate(button.dataset.view);

    });

});


$$("[data-goto]").forEach(button => {

    button.addEventListener("click", function () {

        navigate(button.dataset.goto);

    });

});

window.addEventListener("popstate", event => {
    const view = event.state?.campusCoreView;

    if (!view || !allowed(view)) {
        return;
    }

    let direction = "forward";

    if (appViewHistory[appViewIndex - 1] === view) {
        appViewIndex -= 1;
        direction = "back";
    } else if (appViewHistory[appViewIndex + 1] === view) {
        appViewIndex += 1;
    } else {
        appViewHistory = [view];
        appViewIndex = 0;
    }

    navigate(view, { fromHistory: true, direction });
});

const contentArea = $(".content-area");
let swipeStart = null;

contentArea.addEventListener("touchstart", event => {
    if (event.touches.length !== 1) {
        swipeStart = null;
        return;
    }

    const bounds = contentArea.getBoundingClientRect();
    const touch = event.touches[0];

    swipeStart = touch.clientX - bounds.left <= 32
        ? { x: touch.clientX, y: touch.clientY }
        : null;
}, { passive: true });

contentArea.addEventListener("touchend", event => {
    if (!swipeStart || appViewIndex === 0) {
        swipeStart = null;
        return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;

    if (deltaX > 90 && Math.abs(deltaY) < 70) {
        history.back();
    }

    swipeStart = null;
}, { passive: true });


/* =====================================
   SIDEBAR TOGGLE
===================================== */

$("#sidebarToggle").addEventListener("click", function () {

    $("#sidebar").classList.toggle("open");

});


/* =====================================
   DARK MODE
===================================== */

function applyTheme() {

    const theme = localStorage.getItem("campuscore_theme") || "light";

    document.body.classList.toggle(
        "dark-mode",
        theme === "dark"
    );

    $("#themeIcon").textContent =
        theme === "dark" ? "☀" : "☾";

    $("#themeText").textContent =
        theme === "dark" ? "Light Mode" : "Dark Mode";

    $("#themeToggle").setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );

}


$("#themeToggle").addEventListener("click", function () {

    const darkMode = document.body.classList.contains("dark-mode");

    localStorage.setItem(
        "campuscore_theme",
        darkMode ? "light" : "dark"
    );

    applyTheme();

});


applyTheme();


/* =====================================
   UPDATE STUDENT SELECT MENUS
===================================== */

function updateStudentDropdowns() {

    const dropdownIds = [
        "reportStudent",
        "attendanceStudent"
    ];

    dropdownIds.forEach(dropdownId => {

        const dropdown = document.getElementById(dropdownId);

        const previousValue = dropdown.value;

        dropdown.innerHTML = `
            <option value="">Select student</option>
        `;

        students.forEach(student => {

            const option = document.createElement("option");

            option.value = student.id;

            option.textContent =
                `${student.id} - ${student.name}`;

            dropdown.appendChild(option);

        });

        if (students.some(student => student.id === previousValue)) {
            dropdown.value = previousValue;
        }

    });

}


/* =====================================
   DASHBOARD
===================================== */

// function renderDashboard() {

//     $("#totalStudents").textContent = students.length;

//     $("#totalTeachers").textContent = teachers.length;

//     $("#totalAttendance").textContent = attendance.length;

//     $("#totalReports").textContent = reports.length;


//     const recent = [...students].slice(-5).reverse();

//     const table = $("#recentStudentsTable");

//     if (recent.length === 0) {

//         showEmptyRow(
//             "recentStudentsTable",
//             5,
//             "No students have been added yet."
//         );

//         return;
//     }


//     table.innerHTML = recent.map(student => `

//         <tr>

//             <td>${safe(student.id)}</td>

//             <td>${safe(student.name)}</td>

//             <td>${safe(student.email)}</td>

//             <td>${safe(student.department)}</td>

//             <td>${safe(student.year)}</td>

//         </tr>

//     `).join("");

// }


function renderDashboard() {
    const role = currentUser.role;

    // Show statistics only where appropriate
    const statsGrid = document.querySelector(".stats-grid");

    if (role === "student") {
        statsGrid.classList.add("hidden");
    } else {
        statsGrid.classList.remove("hidden");
    }

    // Show recent students only to admin and teacher
    const recentStudentsSection = document
        .getElementById("recentStudentsTable")
        .closest(".section-heading")
        ?.parentElement;

    if (recentStudentsSection) {
        recentStudentsSection.classList.toggle(
            "hidden",
            role === "student"
        );
    }

    if (role === "admin" || role === "teacher") {
        $("#totalStudents").textContent = students.length;
        $("#totalTeachers").textContent = teachers.length;
        $("#totalAttendance").textContent = attendance.length;
        $("#totalReports").textContent = reports.length;

        const recent = [...students].slice(-5).reverse();

        if (recent.length === 0) {
            showEmptyRow(
                "recentStudentsTable",
                5,
                "No students available."
            );
        } else {
            $("#recentStudentsTable").innerHTML = recent.map(student => `
                <tr>
                    <td>${safe(student.id)}</td>
                    <td>${safe(student.name)}</td>
                    <td>${safe(student.email)}</td>
                    <td>${safe(student.department)}</td>
                    <td>${safe(student.year)}</td>
                </tr>
            `).join("");
        }
    }
}


/* =====================================
   STUDENT MANAGEMENT
===================================== */

function renderStudents() {

    const query = $("#studentSearch").value.trim().toLowerCase();

    const filtered = students.filter(student => {

        return searchMatch(student, query);

    });


    $("#studentCount").textContent =
        `${filtered.length} student${filtered.length !== 1 ? "s" : ""}`;


    const table = $("#studentsTable");


    if (filtered.length === 0) {

        showEmptyRow(
            "studentsTable",
            6,
            query ? "No matching students found." : "No students available."
        );

        return;
    }


    table.innerHTML = filtered.map(student => {

        return `

            <tr>

                <td>${safe(student.id)}</td>

                <td>${safe(student.name)}</td>

                <td>${safe(student.email)}</td>

                <td>${safe(student.department)}</td>

                <td>${safe(student.year)}</td>

                <td>

                    ${
                        currentUser.role === "admin"

                        ? `
                            <button
                                class="table-action"
                                data-delete-student="${safe(student.id)}"
                            >
                                Delete
                            </button>
                        `

                        : "-"
                    }

                </td>

            </tr>

        `;

    }).join("");

}


/* ADD STUDENT */

$("#studentForm").addEventListener("submit", function (event) {

    event.preventDefault();

    if (!["admin", "teacher"].includes(currentUser.role)) {

        showToast("Only teachers and administrators can add students.", "error");

        return;
    }


    const id = $("#studentId").value.trim().toUpperCase();

    const name = $("#studentName").value.trim();

    const email = $("#studentEmail").value.trim();

    const department = $("#studentDepartment").value.trim();

    const year = $("#studentYear").value;

    const password = $("#studentPassword").value;


    const duplicateId = users.some(user => user.id.toUpperCase() === id);

    const duplicateEmail = users.some(
        user => user.email.toLowerCase() === email.toLowerCase()
    );


    if (duplicateId) {

        showToast("This user ID already exists.", "error");

        return;
    }


    if (duplicateEmail) {

        showToast("This email is already registered.", "error");

        return;
    }


    const student = {
        id,
        name,
        email,
        department,
        year
    };


    students.push(student);


    users.push({
        id,
        password,
        name,
        email,
        role: "student",
        department,
        year
    });


    save("campuscore_students", students);

    save("campuscore_users", users);


    $("#studentForm").reset();


    renderAll();

    showToast("Student added successfully.");

});


/* DELETE STUDENT */

$("#studentsTable").addEventListener("click", function (event) {

    const button = event.target.closest("[data-delete-student]");

    if (!button) {
        return;
    }


    if (currentUser.role !== "admin") {

        showToast("You cannot delete students.", "error");

        return;
    }


    const id = button.dataset.deleteStudent;

    const student = students.find(item => item.id === id);

    if (!student) {
        return;
    }


    const confirmed = confirm(
        `Delete student ${student.name}? Their associated grades and attendance records will also be deleted.`
    );

    if (!confirmed) {
        return;
    }


    students = students.filter(item => item.id !== id);

    users = users.filter(user => user.id !== id);

    reports = reports.filter(report => report.studentId !== id);

    attendance = attendance.filter(record => record.studentId !== id);


    save("campuscore_students", students);

    save("campuscore_users", users);

    save("campuscore_reports", reports);

    save("campuscore_attendance", attendance);


    renderAll();

    showToast("Student and associated records deleted.");

});


/* STUDENT SEARCH */

$("#studentSearch").addEventListener("input", renderStudents);


/* =====================================
   TEACHER MANAGEMENT
===================================== */

function renderTeachers() {

    const query = $("#teacherSearch").value.trim().toLowerCase();

    const filtered = teachers.filter(teacher => {

        return searchMatch(teacher, query);

    });


    $("#teacherCount").textContent = teachers.length;

    $("#teacherDepartments").textContent =
        new Set(
            teachers.map(teacher => teacher.department.toLowerCase())
        ).size;


    const table = $("#teachersTable");


    if (filtered.length === 0) {

        showEmptyRow(
            "teachersTable",
            7,
            query ? "No matching teachers found." : "No teachers available."
        );

        return;
    }


    table.innerHTML = filtered.map(teacher => `

        <tr>

            <td>${safe(teacher.id)}</td>

            <td>${safe(teacher.name)}</td>

            <td>${safe(teacher.email)}</td>

            <td>${safe(teacher.department)}</td>

            <td>${safe(teacher.designation)}</td>

            <td>${safe(teacher.phone || "-")}</td>

            <td>

                ${
                    currentUser.role === "admin"

                    ? `
                        <button
                            class="table-action"
                            data-delete-teacher="${safe(teacher.id)}"
                        >
                            Delete
                        </button>
                    `

                    : "-"
                }

            </td>

        </tr>

    `).join("");

}


/* ADD TEACHER */

$("#teacherForm").addEventListener("submit", function (event) {

    event.preventDefault();

    if (currentUser.role !== "admin") {

        showToast("Only administrators can add teachers.", "error");

        return;
    }


    const id = $("#teacherId").value.trim().toUpperCase();

    const name = $("#teacherName").value.trim();

    const email = $("#teacherEmail").value.trim();

    const department = $("#teacherDepartment").value.trim();

    const designation = $("#teacherDesignation").value.trim();

    const phone = $("#teacherPhone").value.trim();

    const password = $("#teacherPassword").value;


    const duplicateId = users.some(user => user.id.toUpperCase() === id);

    const duplicateEmail = users.some(
        user => user.email.toLowerCase() === email.toLowerCase()
    );


    if (duplicateId) {

        showToast("This user ID already exists.", "error");

        return;
    }


    if (duplicateEmail) {

        showToast("This email is already registered.", "error");

        return;
    }


    const teacher = {
        id,
        name,
        email,
        department,
        designation,
        phone
    };


    teachers.push(teacher);


    users.push({
        id,
        password,
        name,
        email,
        role: "teacher",
        department,
        designation,
        phone
    });


    save("campuscore_teachers", teachers);

    save("campuscore_users", users);


    $("#teacherForm").reset();


    renderAll();

    showToast("Teacher added successfully.");

});


/* DELETE TEACHER */

$("#teachersTable").addEventListener("click", function (event) {

    const button = event.target.closest("[data-delete-teacher]");

    if (!button) {
        return;
    }


    if (currentUser.role !== "admin") {

        showToast("You cannot delete teachers.", "error");

        return;
    }


    const id = button.dataset.deleteTeacher;

    const teacher = teachers.find(item => item.id === id);

    if (!teacher) {
        return;
    }


    const confirmed = confirm(`Delete teacher ${teacher.name}?`);

    if (!confirmed) {
        return;
    }


    teachers = teachers.filter(item => item.id !== id);

    users = users.filter(user => user.id !== id);


    save("campuscore_teachers", teachers);

    save("campuscore_users", users);


    renderAll();

    showToast("Teacher deleted successfully.");

});


/* TEACHER SEARCH */

$("#teacherSearch").addEventListener("input", renderTeachers);


/* =====================================
   REPORTS AND GRADES
===================================== */

function renderReports() {

    updateStudentDropdowns();


    const query = $("#reportSearch").value.trim().toLowerCase();


    let filtered = reports.filter(report => {

        const student = students.find(
            item => item.id === report.studentId
        );


        const searchable = {
            studentId: report.studentId,
            studentName: student?.name || "Unknown Student",
            subject: report.subject,
            marks: report.marks,
            grade: grade(Number(report.marks))
        };


        return searchMatch(searchable, query);

    });


    const table = $("#reportsTable");


    if (filtered.length === 0) {

        showEmptyRow(
            "reportsTable",
            6,
            query ? "No matching grade records found." : "No grades available."
        );

        return;
    }


    table.innerHTML = filtered.map(report => {

        const student = students.find(
            item => item.id === report.studentId
        );


        return `

            <tr>

                <td>${safe(report.studentId)}</td>

                <td>${safe(student?.name || "Unknown Student")}</td>

                <td>${safe(report.subject)}</td>

                <td>${safe(report.marks)}/100</td>

                <td>
                    <span class="badge badge-grade">
                        ${grade(Number(report.marks))}
                    </span>
                </td>

                <td>

                    ${
                        currentUser.role !== "student"

                        ? `
                            <button
                                class="table-action"
                                data-delete-report="${report.id}"
                            >
                                Delete
                            </button>
                        `

                        : "-"
                    }

                </td>

            </tr>

        `;

    }).join("");

}


/* ADD GRADE */

$("#reportForm").addEventListener("submit", function (event) {

    event.preventDefault();

    if (currentUser.role === "student") {

        showToast("You cannot add grades.", "error");

        return;
    }


    const studentId = $("#reportStudent").value;

    const subject = $("#reportSubject").value.trim();

    const marks = Number($("#reportMarks").value);


    if (!studentId) {

        showToast("Please select a student.", "error");

        return;
    }


    if (marks < 0 || marks > 100 || !Number.isFinite(marks)) {

        showToast("Marks must be between 0 and 100.", "error");

        return;
    }


    reports.push({
        id: Date.now(),
        studentId,
        subject,
        marks
    });


    save("campuscore_reports", reports);


    $("#reportForm").reset();


    renderAll();

    showToast("Grade added successfully.");

});


/* DELETE GRADE */

$("#reportsTable").addEventListener("click", function (event) {

    const button = event.target.closest("[data-delete-report]");

    if (!button) {
        return;
    }


    if (currentUser.role === "student") {

        showToast("You cannot delete grades.", "error");

        return;
    }


    const id = Number(button.dataset.deleteReport);

    reports = reports.filter(report => report.id !== id);


    save("campuscore_reports", reports);


    renderAll();

    showToast("Grade record deleted.");

});


/* REPORT SEARCH */

$("#reportSearch").addEventListener("input", renderReports);


/* =====================================
   ATTENDANCE MANAGEMENT
===================================== */

function renderAttendance() {

    updateStudentDropdowns();


    const query = $("#attendanceSearch").value.trim().toLowerCase();


    const filtered = attendance.filter(record => {

        const student = students.find(
            item => item.id === record.studentId
        );


        const searchable = {
            studentId: record.studentId,
            studentName: student?.name || "Unknown Student",
            date: record.date,
            status: record.status
        };


        return searchMatch(searchable, query);

    });


    const table = $("#attendanceTable");


    if (filtered.length === 0) {

        showEmptyRow(
            "attendanceTable",
            5,
            query
                ? "No matching attendance records found."
                : "No attendance records available."
        );

        return;
    }


    table.innerHTML = filtered.map(record => {

        const student = students.find(
            item => item.id === record.studentId
        );


        const badgeClass =
            record.status === "Present"
                ? "badge-present"
                : "badge-absent";


        return `

            <tr>

                <td>${safe(record.studentId)}</td>

                <td>${safe(student?.name || "Unknown Student")}</td>

                <td>${safe(record.date)}</td>

                <td>

                    <span class="badge ${badgeClass}">
                        ${safe(record.status)}
                    </span>

                </td>

                <td>

                    ${
                        currentUser.role !== "student"

                        ? `
                            <button
                                class="table-action"
                                data-delete-attendance="${record.id}"
                            >
                                Delete
                            </button>
                        `

                        : "-"
                    }

                </td>

            </tr>

        `;

    }).join("");

}


/* ADD ATTENDANCE */

$("#attendanceForm").addEventListener("submit", function (event) {

    event.preventDefault();

    if (currentUser.role === "student") {

        showToast("You cannot mark attendance.", "error");

        return;
    }


    const studentId = $("#attendanceStudent").value;

    const date = $("#attendanceDate").value;

    const status = $("#attendanceStatus").value;


    if (!studentId) {

        showToast("Please select a student.", "error");

        return;
    }


    const duplicate = attendance.some(record => {

        return record.studentId === studentId
            && record.date === date;

    });


    if (duplicate) {

        showToast(
            "Attendance for this student and date already exists.",
            "error"
        );

        return;
    }


    attendance.push({
        id: Date.now(),
        studentId,
        date,
        status
    });


    save("campuscore_attendance", attendance);


    $("#attendanceForm").reset();

    $("#attendanceDate").value = today();


    renderAll();

    showToast("Attendance saved successfully.");

});


/* DELETE ATTENDANCE */

$("#attendanceTable").addEventListener("click", function (event) {

    const button = event.target.closest("[data-delete-attendance]");

    if (!button) {
        return;
    }


    if (currentUser.role === "student") {

        showToast("You cannot delete attendance.", "error");

        return;
    }


    const id = Number(button.dataset.deleteAttendance);

    attendance = attendance.filter(record => record.id !== id);


    save("campuscore_attendance", attendance);


    renderAll();

    showToast("Attendance record deleted.");

});


/* ATTENDANCE SEARCH */

$("#attendanceSearch").addEventListener("input", renderAttendance);


/* =====================================
   STUDENT ACADEMIC VIEW
===================================== */

function renderAcademics() {

    if (!currentUser || currentUser.role !== "student") {
        return;
    }


    const myReports = reports.filter(report => {

        return report.studentId === currentUser.id;

    });


    const myAttendance = attendance.filter(record => {

        return record.studentId === currentUser.id;

    });


    const marks = myReports.map(report => Number(report.marks));

    const averageMarks = average(marks);


    const presentCount = myAttendance.filter(record => {

        return record.status === "Present";

    }).length;


    const attendancePercent = myAttendance.length > 0

        ? (presentCount / myAttendance.length) * 100

        : 0;


    $("#mySubjectCount").textContent = myReports.length;

    $("#myAverageMarks").textContent =
        `${averageMarks.toFixed(1)}%`;

    $("#myAttendancePercent").textContent =
        `${attendancePercent.toFixed(1)}%`;


    if (myReports.length === 0) {

        showEmptyRow(
            "myGradesTable",
            3,
            "No grades have been recorded yet."
        );

    } else {

        $("#myGradesTable").innerHTML = myReports.map(report => `

            <tr>

                <td>${safe(report.subject)}</td>

                <td>${safe(report.marks)}/100</td>

                <td>
                    <span class="badge badge-grade">
                        ${grade(Number(report.marks))}
                    </span>
                </td>

            </tr>

        `).join("");

    }


    if (myAttendance.length === 0) {

        showEmptyRow(
            "myAttendanceTable",
            2,
            "No attendance records have been recorded yet."
        );

    } else {

        $("#myAttendanceTable").innerHTML = myAttendance.map(record => {

            const badgeClass =
                record.status === "Present"
                    ? "badge-present"
                    : "badge-absent";


            return `

                <tr>

                    <td>${safe(record.date)}</td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${safe(record.status)}
                        </span>
                    </td>

                </tr>

            `;

        }).join("");

    }

}


/* =====================================
   ADMINISTRATION
===================================== */

function renderAdmin() {

    $("#adminStudentCount").textContent = students.length;

    $("#adminTeacherCount").textContent = teachers.length;

    $("#adminAttendanceCount").textContent = attendance.length;

    $("#adminReportCount").textContent = reports.length;

}


/* =====================================
   EXPORT DATA
===================================== */

$("#exportDataBtn").addEventListener("click", function () {

    if (currentUser?.role !== "admin") {

        showToast("Only administrators can export data.", "error");

        return;
    }


    const exportObject = {

        exportedAt: new Date().toISOString(),

        students,

        teachers,

        reports,

        attendance

    };


    const data = JSON.stringify(exportObject, null, 2);

    const blob = new Blob(
        [data],
        { type: "application/json" }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "campuscore-data.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    showToast("Data exported successfully.");

});


/* =====================================
   IMPORT PEOPLE FROM EXCEL
===================================== */

$("#importPeopleBtn").addEventListener("click", async function () {
    const fileInput = $("#peopleImportFile");
    const status = $("#importPeopleStatus");
    const file = fileInput.files[0];

    if (currentUser?.role !== "admin") {
        showToast("Only administrators can import people.", "error");
        return;
    }

    if (!file) {
        showToast("Choose an Excel or CSV file first.", "error");
        return;
    }

    if (!window.XLSX) {
        showToast("The spreadsheet reader could not be loaded. Check your internet connection and try again.", "error");
        return;
    }

    try {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });
        const importedIds = new Set();
        const importedEmails = new Set();
        let addedStudents = 0;
        let addedTeachers = 0;
        let skipped = 0;

        rows.forEach(row => {
            const values = {};
            Object.entries(row).forEach(([key, value]) => {
                values[String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, "")] = String(value).trim();
            });

            const get = (...keys) => {
                for (const key of keys) {
                    const value = values[key];
                    if (value) return value;
                }
                return "";
            };

            const id = get("id", "userid", "studentid", "teacherid").toUpperCase();
            const name = get("name", "fullname");
            const email = get("email", "emailaddress").toLowerCase();
            const department = get("department", "dept");
            const roleText = get("role", "type", "usertype").toLowerCase();
            const role = roleText.startsWith("teach") ? "teacher" : roleText.startsWith("stud") ? "student" : "";
            const emailTaken = users.some(user => user.email.toLowerCase() === email)
                || importedEmails.has(email);

            if (!id || !name || !email || !department || !role
                || users.some(user => user.id.toUpperCase() === id)
                || importedIds.has(id) || emailTaken) {
                skipped += 1;
                return;
            }

            const firstName = name.split(/\s+/)[0];
            const person = { id, name, email, department };
            const user = { id, password: firstName, name, email, role, department };

            if (role === "student") {
                const year = get("year", "academicyear", "studyyear");
                if (!year) {
                    skipped += 1;
                    return;
                }
                person.year = year;
                user.year = year;
                students.push(person);
                addedStudents += 1;
            } else {
                const designation = get("designation", "title");
                const phone = get("phone", "phonenumber", "mobile");
                if (designation) person.designation = user.designation = designation;
                if (phone) person.phone = user.phone = phone;
                teachers.push(person);
                addedTeachers += 1;
            }

            users.push(user);
            importedIds.add(id);
            importedEmails.add(email);
        });

        save("campuscore_users", users);
        save("campuscore_students", students);
        save("campuscore_teachers", teachers);
        fileInput.value = "";
        status.textContent = `Added ${addedStudents} students and ${addedTeachers} teachers. Skipped ${skipped} row(s).`;
        renderAll();
        showToast(`Import complete: ${addedStudents + addedTeachers} people added.`);
    } catch (error) {
        console.error("Could not import spreadsheet:", error);
        showToast("Could not read this file. Check that it is a valid Excel or CSV sheet.", "error");
    }
});


/* =====================================
   RENDER EVERYTHING
===================================== */

function renderAll() {

    renderDashboard();

    renderStudents();

    renderTeachers();

    renderReports();

    renderAttendance();

    renderAcademics();

    renderAdmin();

}


async function initializeDatabase() {
    try {
        const response = await fetch("/api/state");
        if (!response.ok) throw new Error("Database server is unavailable");
        const state = await response.json();
        const hasDatabaseData = state.users.length > 0;

        if (hasDatabaseData) {
            users = state.users;
            students = state.students;
            teachers = state.teachers;
            reports = state.reports;
            attendance = state.attendance;
            ["users", "students", "teachers", "reports", "attendance"].forEach(collection => {
                localStorage.setItem(`campuscore_${collection}`, JSON.stringify(state[collection]));
            });
            currentUser = users.find(user => user.id === currentUser?.id) || null;
        } else {
            // First run: seed SQLite from existing browser data (or the demo defaults).
            queueDatabaseSave();
        }

        databaseReady = true;
    } catch (error) {
        console.error("Database connection failed:", error);
        showToast("Database server is offline. Changes will stay in this browser only.", "error");
    }

    startApplication();
}


/* =====================================
   DEFAULT FORM VALUES
===================================== */

$("#attendanceDate").value = today();
updateClock();
setInterval(updateClock, 1000);


/* =====================================
   START OR RESTORE SESSION
===================================== */

initializeDatabase();
