"use strict";

// ============================================
// 1. DEMO ACCOUNTS
// ============================================

var USERS = [
    {
        id: "STU1001",
        password: "student123",
        name: "Aarav Sharma",
        role: "student",
        email: "aarav@example.com",
        department: "Computer Science",
        semester: "3rd Semester"
    },
    {
        id: "STU1002",
        password: "student123",
        name: "Priya Verma",
        role: "student",
        email: "priya@example.com",
        department: "Computer Science",
        semester: "3rd Semester"
    },
    {
        id: "STU1003",
        password: "student123",
        name: "Rahul Singh",
        role: "student",
        email: "rahul@example.com",
        department: "Computer Science",
        semester: "3rd Semester"
    },
    {
        id: "TCH1001",
        password: "teacher123",
        name: "Dr. Neha Gupta",
        role: "teacher",
        email: "neha@example.com",
        department: "Computer Science",
        semester: "Faculty"
    },
    {
        id: "ADMIN",
        password: "admin123",
        name: "Campus Administrator",
        role: "admin",
        email: "admin@example.com",
        department: "Administration",
        semester: "Admin"
    }
];


// ============================================
// 2. STORAGE
// ============================================

function loadArray(key) {
    try {
        var value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

function saveArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

var students = loadArray("campuscore_students");
var reports = loadArray("campuscore_reports");
var attendance = loadArray("campuscore_attendance");
var currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("campuscore_currentUser") || "null"
    );
} catch (error) {
    currentUser = null;
}


// ============================================
// 3. SAMPLE DATA
// ============================================

if (students.length === 0) {
    students = [
        {
            id: "STU1001",
            name: "Aarav Sharma",
            email: "aarav@example.com",
            department: "Computer Science",
            semester: "3rd Semester"
        },
        {
            id: "STU1002",
            name: "Priya Verma",
            email: "priya@example.com",
            department: "Computer Science",
            semester: "3rd Semester"
        },
        {
            id: "STU1003",
            name: "Rahul Singh",
            email: "rahul@example.com",
            department: "Computer Science",
            semester: "3rd Semester"
        }
    ];
    saveArray("campuscore_students", students);
}

if (reports.length === 0) {
    reports = [
        {
            id: 1,
            studentId: "STU1001",
            subject: "DBMS",
            marks: 88,
            total: 100,
            grade: "A",
            date: "2026-10-20"
        },
        {
            id: 2,
            studentId: "STU1001",
            subject: "OOP",
            marks: 92,
            total: 100,
            grade: "A+",
            date: "2026-10-21"
        },
        {
            id: 3,
            studentId: "STU1001",
            subject: "Data Structures",
            marks: 79,
            total: 100,
            grade: "B+",
            date: "2026-10-22"
        },
        {
            id: 4,
            studentId: "STU1002",
            subject: "DBMS",
            marks: 85,
            total: 100,
            grade: "A",
            date: "2026-10-20"
        },
        {
            id: 5,
            studentId: "STU1002",
            subject: "OOP",
            marks: 76,
            total: 100,
            grade: "B+",
            date: "2026-10-21"
        },
        {
            id: 6,
            studentId: "STU1003",
            subject: "Data Structures",
            marks: 90,
            total: 100,
            grade: "A+",
            date: "2026-10-22"
        }
    ];
    saveArray("campuscore_reports", reports);
}

if (attendance.length === 0) {
    attendance = [
        { id: 1, studentId: "STU1001", date: "2026-10-20", status: "Present" },
        { id: 2, studentId: "STU1001", date: "2026-10-21", status: "Present" },
        { id: 3, studentId: "STU1001", date: "2026-10-22", status: "Absent" },
        { id: 4, studentId: "STU1002", date: "2026-10-20", status: "Present" },
        { id: 5, studentId: "STU1002", date: "2026-10-21", status: "Present" },
        { id: 6, studentId: "STU1003", date: "2026-10-20", status: "Present" }
    ];
    saveArray("campuscore_attendance", attendance);
}


// ============================================
// 4. HELPERS
// ============================================

function todayString() {
    var date = new Date();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");

    return date.getFullYear() + "-" + month + "-" + day;
}

function escapeHTML(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getStudentName(id) {
    var student = students.find(function (item) {
        return item.id === id;
    });

    return student ? student.name : id;
}

function getGrade(marks, total) {
    var percent = total > 0 ? marks * 100 / total : 0;

    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B+";
    if (percent >= 60) return "B";
    if (percent >= 50) return "C";
    if (percent >= 40) return "D";
    return "F";
}

function getPercentage(marks, total) {
    return total > 0 ? Math.round(marks * 100 / total) : 0;
}

function getMyReports() {
    return currentUser
        ? reports.filter(function (item) {
            return item.studentId === currentUser.id;
        })
        : [];
}

function getMyAttendance() {
    return currentUser
        ? attendance.filter(function (item) {
            return item.studentId === currentUser.id;
        })
        : [];
}


// ============================================
// 5. LOGIN AND LOGOUT
// ============================================

function login(event) {
    event.preventDefault();

    var id = document.getElementById("loginId").value.trim().toUpperCase();
    var password = document.getElementById("loginPassword").value;
    var errorBox = document.getElementById("loginError");

    var user = USERS.find(function (item) {
        return item.id === id && item.password === password;
    });

    if (!user) {
        errorBox.textContent = "Incorrect ID or password.";
        return;
    }

    currentUser = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department,
        semester: user.semester
    };

    localStorage.setItem(
        "campuscore_currentUser",
        JSON.stringify(currentUser)
    );

    errorBox.textContent = "";
    showApplication();
}

function logout() {
    currentUser = null;
    localStorage.removeItem("campuscore_currentUser");

    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("loginForm").reset();
}


// ============================================
// 6. APPLICATION AND NAVIGATION
// ============================================

function showApplication() {
    if (!currentUser) return;

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    updateUserInterface();
    setupNavigation();
    renderAll();
    showView("dashboard");
}

function updateUserInterface() {
    document.getElementById("userName").textContent = currentUser.name;
    document.getElementById("userRole").textContent = currentUser.role.toUpperCase();
    document.getElementById("welcomeName").textContent = currentUser.name;

    var initials = currentUser.name.split(" ").map(function (part) {
        return part.charAt(0);
    }).join("").substring(0, 2).toUpperCase();

    document.getElementById("userAvatar").textContent = initials;
    document.getElementById("profileAvatar").textContent = initials;
}

function getAllowedViews() {
    if (currentUser.role === "admin") {
        return ["dashboard", "students", "reports", "attendance", "admin", "profile"];
    }

    if (currentUser.role === "teacher") {
        return ["dashboard", "students", "reports", "attendance", "profile"];
    }

    return ["dashboard", "myAcademics", "profile"];
}

function setupNavigation() {
    var allowed = getAllowedViews();

    document.querySelectorAll("[data-view]").forEach(function (item) {
        var view = item.getAttribute("data-view");

        item.style.display = allowed.indexOf(view) >= 0 ? "" : "none";

        item.onclick = function (event) {
            event.preventDefault();
            showView(view);
        };
    });
}

function showView(name) {
    if (getAllowedViews().indexOf(name) < 0) return;

    document.querySelectorAll(".view").forEach(function (view) {
        view.classList.add("hidden");
    });

    var target = document.getElementById(name + "View");
    if (target) target.classList.remove("hidden");

    document.querySelectorAll("[data-view]").forEach(function (item) {
        item.classList.toggle("active", item.getAttribute("data-view") === name);
    });

    var titles = {
        dashboard: "Dashboard",
        students: "Students",
        reports: "Reports & Grades",
        attendance: "Attendance",
        myAcademics: "My Academics",
        admin: "Administration",
        profile: "My Profile"
    };

    document.getElementById("pageTitle").textContent = titles[name] || "CampusCore";
    document.getElementById("sidebar").classList.remove("open");
}


// ============================================
// 7. DASHBOARD
// ============================================

function renderDashboard() {
    var container = document.getElementById("statsGrid");

    if (currentUser.role === "student") {
        var myReports = getMyReports();
        var myAttendance = getMyAttendance();
        var present = myAttendance.filter(function (item) {
            return item.status === "Present";
        }).length;

        var average = myReports.length
            ? Math.round(myReports.reduce(function (sum, item) {
                return sum + getPercentage(item.marks, item.total);
            }, 0) / myReports.length)
            : 0;

        var rate = myAttendance.length
            ? Math.round(present / myAttendance.length * 100)
            : 0;

        container.innerHTML =
            '<div class="stat-card"><h3>My Subjects</h3><p>' + myReports.length + '</p></div>' +
            '<div class="stat-card"><h3>Average Marks</h3><p>' + average + '%</p></div>' +
            '<div class="stat-card"><h3>Attendance</h3><p>' + rate + '%</p></div>' +
            '<div class="stat-card"><h3>Student ID</h3><p>' + escapeHTML(currentUser.id) + '</p></div>';

        return;
    }

    var presentCount = attendance.filter(function (item) {
        return item.status === "Present";
    }).length;

    var attendanceRate = attendance.length
        ? Math.round(presentCount / attendance.length * 100)
        : 0;

    container.innerHTML =
        '<div class="stat-card"><h3>Total Students</h3><p>' + students.length + '</p></div>' +
        '<div class="stat-card"><h3>Academic Reports</h3><p>' + reports.length + '</p></div>' +
        '<div class="stat-card"><h3>Attendance Records</h3><p>' + attendance.length + '</p></div>' +
        '<div class="stat-card"><h3>Attendance Rate</h3><p>' + attendanceRate + '%</p></div>';
}


// ============================================
// 8. STUDENTS
// ============================================

function renderStudents() {
    var table = document.getElementById("studentsTable");

    if (students.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No students found.</td></tr>';
        return;
    }

    table.innerHTML = students.map(function (student) {
        return '<tr>' +
            '<td>' + escapeHTML(student.id) + '</td>' +
            '<td>' + escapeHTML(student.name) + '</td>' +
            '<td>' + escapeHTML(student.email) + '</td>' +
            '<td>' + escapeHTML(student.department) + '</td>' +
            '<td>' + escapeHTML(student.semester) + '</td>' +
            '</tr>';
    }).join("");

    var studentOptions = '<option value="">Select student</option>';

    students.forEach(function (student) {
        studentOptions += '<option value="' + escapeHTML(student.id) + '">' +
            escapeHTML(student.id + " - " + student.name) + '</option>';
    });

    document.getElementById("reportStudentId").innerHTML = studentOptions;
    document.getElementById("attendanceStudentId").innerHTML = studentOptions;
}

function addStudent(event) {
    event.preventDefault();

    if (currentUser.role === "student") return;

    var id = document.getElementById("studentId").value.trim().toUpperCase();
    var name = document.getElementById("studentName").value.trim();
    var email = document.getElementById("studentEmail").value.trim();
    var department = document.getElementById("studentDepartment").value.trim();
    var semester = document.getElementById("studentSemester").value.trim();

    if (!id || !name || !email || !department || !semester) {
        alert("Please complete all fields.");
        return;
    }

    if (students.some(function (item) {
        return item.id === id;
    })) {
        alert("That student ID already exists.");
        return;
    }

    students.push({
        id: id,
        name: name,
        email: email,
        department: department,
        semester: semester
    });

    saveArray("campuscore_students", students);
    document.getElementById("studentForm").reset();
    renderAll();
    alert("Student added successfully.");
}


// ============================================
// 9. REPORTS AND GRADES
// ============================================

function renderReports() {
    var table = document.getElementById("reportsTable");
    var visible = currentUser.role === "student" ? getMyReports() : reports;

    if (visible.length === 0) {
        table.innerHTML = '<tr><td colspan="7">No reports found.</td></tr>';
        return;
    }

    table.innerHTML = visible.map(function (report) {
        return '<tr>' +
            '<td>' + escapeHTML(report.studentId) + '</td>' +
            '<td>' + escapeHTML(getStudentName(report.studentId)) + '</td>' +
            '<td>' + escapeHTML(report.subject) + '</td>' +
            '<td>' + report.marks + '</td>' +
            '<td>' + report.total + '</td>' +
            '<td>' + escapeHTML(report.grade || getGrade(report.marks, report.total)) + '</td>' +
            '<td>' + escapeHTML(report.date) + '</td>' +
            '</tr>';
    }).join("");
}

function addReport(event) {
    event.preventDefault();

    if (currentUser.role === "student") return;

    var studentId = document.getElementById("reportStudentId").value;
    var subject = document.getElementById("reportSubject").value.trim();
    var marks = Number(document.getElementById("reportMarks").value);
    var total = Number(document.getElementById("reportTotal").value);
    var date = document.getElementById("reportDate").value;

    if (!studentId || !subject || !date) {
        alert("Please complete all report fields.");
        return;
    }

    if (!Number.isFinite(marks) || !Number.isFinite(total) ||
        total <= 0 || marks < 0 || marks > total) {
        alert("Enter valid marks. Marks cannot exceed total marks.");
        return;
    }

    reports.push({
        id: Date.now(),
        studentId: studentId,
        subject: subject,
        marks: marks,
        total: total,
        grade: getGrade(marks, total),
        date: date
    });

    saveArray("campuscore_reports", reports);
    document.getElementById("reportForm").reset();
    document.getElementById("reportTotal").value = "100";
    document.getElementById("reportDate").value = todayString();

    renderAll();
    alert("Marks saved successfully.");
}


// ============================================
// 10. STUDENT ACADEMICS
// ============================================

function renderMyAcademics() {
    if (currentUser.role !== "student") return;

    var myReports = getMyReports();
    var myAttendance = getMyAttendance();

    var reportTable = document.getElementById("myReportsTable");
    var attendanceTable = document.getElementById("myAttendanceTable");

    if (myReports.length === 0) {
        reportTable.innerHTML = '<tr><td colspan="5">No marks available.</td></tr>';
    } else {
        reportTable.innerHTML = myReports.map(function (report) {
            return '<tr>' +
                '<td>' + escapeHTML(report.subject) + '</td>' +
                '<td>' + report.marks + '</td>' +
                '<td>' + report.total + '</td>' +
                '<td>' + getPercentage(report.marks, report.total) + '%</td>' +
                '<td>' + escapeHTML(report.grade || getGrade(report.marks, report.total)) + '</td>' +
                '</tr>';
        }).join("");
    }

    if (myAttendance.length === 0) {
        attendanceTable.innerHTML = '<tr><td colspan="3">No attendance records.</td></tr>';
    } else {
        attendanceTable.innerHTML = myAttendance.map(function (record) {
            return '<tr>' +
                '<td>' + escapeHTML(record.date) + '</td>' +
                '<td>' + escapeHTML(record.status) + '</td>' +
                '<td>' + escapeHTML(record.studentId) + '</td>' +
                '</tr>';
        }).join("");
    }

    var present = myAttendance.filter(function (item) {
        return item.status === "Present";
    }).length;

    var rate = myAttendance.length
        ? Math.round(present / myAttendance.length * 100)
        : 0;

    var average = myReports.length
        ? Math.round(myReports.reduce(function (sum, item) {
            return sum + getPercentage(item.marks, item.total);
        }, 0) / myReports.length)
        : 0;

    document.getElementById("studentStats").innerHTML =
        '<div class="stat-card"><h3>Subjects</h3><p>' + myReports.length + '</p></div>' +
        '<div class="stat-card"><h3>Average Marks</h3><p>' + average + '%</p></div>' +
        '<div class="stat-card"><h3>Classes Present</h3><p>' + present + '</p></div>' +
        '<div class="stat-card"><h3>Attendance</h3><p>' + rate + '%</p></div>';
}


// ============================================
// 11. ATTENDANCE
// ============================================

function renderAttendance() {
    var table = document.getElementById("attendanceTable");
    var visible = currentUser.role === "student" ? getMyAttendance() : attendance;

    if (visible.length === 0) {
        table.innerHTML = '<tr><td colspan="4">No attendance records.</td></tr>';
    } else {
        table.innerHTML = visible.map(function (record) {
            return '<tr>' +
                '<td>' + escapeHTML(record.studentId) + '</td>' +
                '<td>' + escapeHTML(getStudentName(record.studentId)) + '</td>' +
                '<td>' + escapeHTML(record.date) + '</td>' +
                '<td>' + escapeHTML(record.status) + '</td>' +
                '</tr>';
        }).join("");
    }

    renderAttendanceStats();
}

function addAttendance(event) {
    event.preventDefault();

    if (currentUser.role === "student") return;

    var studentId = document.getElementById("attendanceStudentId").value;
    var date = document.getElementById("attendanceDate").value;
    var status = document.getElementById("attendanceStatus").value;

    if (!studentId || !date || !status) {
        alert("Please complete all attendance fields.");
        return;
    }

    var existing = attendance.find(function (item) {
        return item.studentId === studentId && item.date === date;
    });

    if (existing) {
        existing.status = status;
    } else {
        attendance.push({
            id: Date.now(),
            studentId: studentId,
            date: date,
            status: status
        });
    }

    saveArray("campuscore_attendance", attendance);
    document.getElementById("attendanceForm").reset();
    document.getElementById("attendanceDate").value = todayString();

    renderAll();
    alert("Attendance saved successfully.");
}

function renderAttendanceStats() {
    var container = document.getElementById("attendanceStats");

    var present = attendance.filter(function (item) {
        return item.status === "Present";
    }).length;

    var absent = attendance.filter(function (item) {
        return item.status === "Absent";
    }).length;

    var rate = attendance.length
        ? Math.round(present / attendance.length * 100)
        : 0;

    container.innerHTML =
        '<div class="stat-card"><h3>Present</h3><p>' + present + '</p></div>' +
        '<div class="stat-card"><h3>Absent</h3><p>' + absent + '</p></div>' +
        '<div class="stat-card"><h3>Total Records</h3><p>' + attendance.length + '</p></div>' +
        '<div class="stat-card"><h3>Attendance Rate</h3><p>' + rate + '%</p></div>';
}


// ============================================
// 12. ADMINISTRATION
// ============================================

function renderAdmin() {
    if (currentUser.role !== "admin") return;

    document.getElementById("adminStats").innerHTML =
        '<div class="stat-card"><h3>Registered Students</h3><p>' + students.length + '</p></div>' +
        '<div class="stat-card"><h3>Academic Reports</h3><p>' + reports.length + '</p></div>' +
        '<div class="stat-card"><h3>Attendance Records</h3><p>' + attendance.length + '</p></div>' +
        '<div class="stat-card"><h3>Demo Accounts</h3><p>' + USERS.length + '</p></div>';
}


// ============================================
// 13. PROFILE
// ============================================

function renderProfile() {
    var fields = {
        profileName: currentUser.name,
        profileId: currentUser.id,
        profileEmail: currentUser.email,
        profileRole: currentUser.role,
        profileDepartment: currentUser.department,
        profileSemester: currentUser.semester
    };

    Object.keys(fields).forEach(function (id) {
        document.getElementById(id).textContent = fields[id];
    });
}


// ============================================
// 14. RENDER EVERYTHING
// ============================================

function renderAll() {
    renderDashboard();
    renderStudents();
    renderReports();
    renderAttendance();
    renderMyAcademics();
    renderAdmin();
    renderProfile();
}


// ============================================
// 15. START THE APPLICATION
// ============================================

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loginForm").addEventListener("submit", login);
    document.getElementById("studentForm").addEventListener("submit", addStudent);
    document.getElementById("reportForm").addEventListener("submit", addReport);
    document.getElementById("attendanceForm").addEventListener("submit", addAttendance);
    document.getElementById("logoutButton").addEventListener("click", logout);

    document.getElementById("sidebarToggle").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("open");
    });

    document.getElementById("reportDate").value = todayString();
    document.getElementById("attendanceDate").value = todayString();

    if (currentUser) {
        var validUser = USERS.find(function (user) {
            return user.id === currentUser.id && user.role === currentUser.role;
        });

        if (validUser) {
            showApplication();
        } else {
            currentUser = null;
            localStorage.removeItem("campuscore_currentUser");
        }
    }

    if (!currentUser) {
        document.getElementById("app").classList.add("hidden");
        document.getElementById("loginPage").classList.remove("hidden");
    }
});