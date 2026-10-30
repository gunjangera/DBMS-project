# CampusCore Student Management System

CampusCore is a browser-based student management demo backed by a local SQLite database. It includes role-based screens for administrators, teachers, and students; student and teacher records; grades; attendance; and administrator spreadsheet import/export.

## Requirements

- Python 3 (uses only the Python standard library)
- A modern browser
- Internet access when importing Excel files, to load the spreadsheet reader from its CDN
- The `sqlite3` command-line tool is optional; a SQLite GUI such as DB Browser for SQLite also works

## Start the project

Open a terminal in the project directory and run:

```sh
cd "/Users/deepan9477/DBMS PROJECT/DBMS-project"
python3 server.py
```

Open [http://localhost:8000](http://localhost:8000) in the browser. Keep the terminal and server running while using the app. Stop the server with `Ctrl+C`.

Do not open `index.html` directly as a `file://` URL; the website calls the local API at `/api/state` to read and save its database.

On first launch, `campuscore.db` is created in this project folder. The app seeds it from its existing browser data or the demo defaults. Later launches use the database as the source of app data. The browser also keeps a local cache, but the SQLite file is the persistent database when the server is running.

## Demo accounts

| Role | User ID | Password |
| --- | --- | --- |
| Administrator | `ADMIN` | `admin123` |
| Teacher | `TCH1001` | `teacher123` |
| Student | `STU1001` | `student123` |

Other demo students use `student123`. Account data is stored in the database for this local demo.

## Operate the website

1. Start the server and sign in with one of the demo accounts above.
2. Use the left navigation to open Dashboard, Students, Teachers, Reports & Grades, Attendance, My Academics, Administration, and My Profile. Available pages depend on the signed-in role.
3. As an administrator or teacher, use **Students** to add and search student records. Teachers and administrators can add students; administrators can delete them.
4. As an administrator, use **Teachers** to add and search teacher records. Administrators can delete teachers.
5. As an administrator or teacher, use **Reports & Grades** to record marks and search grades.
6. As an administrator or teacher, use **Attendance** to record attendance by student and date. A student can view their own academic and attendance information.
7. As an administrator, use **Administration → Import Data from Excel** to upload student, teacher, marks, and attendance rows, or **Export Data** to download a JSON backup.
8. Use **Logout** to end the current browser session.

### Spreadsheet import columns

For Excel workbooks, use the separate `Students`, `Teachers`, `Marks`, and `Attendance` tabs. CampusCore imports all four tabs. It infers the account role from the Students or Teachers tab. Header names are case-insensitive; spaces and punctuation are ignored.

| Tab | Columns | Rules |
| --- | --- | --- |
| `Students` | `ID (PK)`, `name`, `email`, `department`, `year` | All fields required. `ID` is the student primary key and references `users.id`. |
| `Teachers` | `ID (PK)`, `name`, `email`, `department`, `designation`, `phone` | ID, name, email, and department required. Designation and phone are optional. `ID` is the teacher primary key and references `users.id`. |
| `Marks` | `ID (PK)`, `studentId (FK)`, `subject`, `marks` | Leave `ID` blank to generate the grade primary key. `studentId` is a foreign key to `Students.ID`. Marks must be between 0 and 100. |
| `Attendance` | `ID (PK)`, `studentId (FK)`, `date`, `status` | Leave `ID` blank to generate the attendance primary key. `studentId` is a foreign key to `Students.ID`. Use `YYYY-MM-DD` for date and `Present` or `Absent` for status. |

The marks and attendance `studentId` values must match a student already in the database or a row on the Students tab. The importer processes student rows before marks and attendance, so those references can point to students added in the same workbook. Duplicate IDs, duplicate attendance for the same student/date, and invalid or incomplete rows are skipped.

CSV imports use a single sheet and must include a `role` column. CSV currently imports student/teacher people rows; use an Excel workbook for marks and attendance.

Each imported account's initial password is the first word of its name (for example, `Maya Patel` gets `Maya`). Duplicate IDs/emails and invalid or incomplete rows are skipped. Import requires an internet connection to load the Excel parsing library.

## SQLite database

The file is `campuscore.db` in the project directory. Its tables are:

- `users`: login accounts and shared profile details
- `students`: student profiles, linked to `users`
- `teachers`: teacher profiles, linked to `users`
- `reports`: grades, linked to students
- `attendance`: attendance entries, linked to students

Foreign keys maintain these relationships. Constraints protect unique IDs/emails and grade ranges. Indexes support common grade and attendance lookups.

### Open SQLite

Keep the app server running in one terminal. In a second terminal:

```sh
cd "/Users/deepan9477/DBMS PROJECT/DBMS-project"
sqlite3 campuscore.db
```

At the `sqlite>` prompt, make results readable and inspect the schema:

```sql
.tables
.schema
.schema students
.headers on
.mode column
```

### Select, filter, and sort

```sql
SELECT id, name, email, department, year
FROM students
ORDER BY name;

SELECT id, name, email
FROM students
WHERE department = 'Computer Science';

SELECT studentId, subject, marks
FROM reports
WHERE marks >= 80
ORDER BY marks DESC;

SELECT date, status, studentId
FROM attendance
WHERE date = '2026-10-30'
ORDER BY studentId;
```

### INNER JOIN

An inner join returns only rows with matching values in both tables. This lists students who have a grade:

```sql
SELECT s.id, s.name, r.subject, r.marks
FROM students AS s
INNER JOIN reports AS r ON r.studentId = s.id
ORDER BY s.name, r.subject;
```

Join attendance to student names:

```sql
SELECT s.name, a.date, a.status
FROM attendance AS a
INNER JOIN students AS s ON s.id = a.studentId
ORDER BY a.date DESC, s.name;
```

### LEFT OUTER JOIN

A left outer join returns every row from the left table, including rows without a match on the right. Students with no grade yet will have `NULL` grade columns:

```sql
SELECT s.id, s.name, r.subject, r.marks
FROM students AS s
LEFT OUTER JOIN reports AS r ON r.studentId = s.id
ORDER BY s.name, r.subject;
```

Only students without a grade:

```sql
SELECT s.id, s.name
FROM students AS s
LEFT JOIN reports AS r ON r.studentId = s.id
WHERE r.id IS NULL;
```

SQLite supports `LEFT JOIN` as shorthand for `LEFT OUTER JOIN`. Versions 3.39.0 and newer also support `RIGHT JOIN` and `FULL OUTER JOIN`. Check your version with `SELECT sqlite_version();`. On older versions, use a reversed left join or combine left joins with `UNION` to get equivalent results.

### Counts and grouped results

```sql
SELECT department, COUNT(*) AS student_count
FROM students
GROUP BY department
ORDER BY student_count DESC;

SELECT s.name, AVG(r.marks) AS average_marks
FROM students AS s
INNER JOIN reports AS r ON r.studentId = s.id
GROUP BY s.id, s.name;
```

### Insert, update, and delete examples

These changes modify the live database. Prefer managing records through the website so linked user/profile data stays consistent.

```sql
-- Example insert, only if this user ID and email are unused.
INSERT INTO users (id, password, name, email, role, department, year)
VALUES ('STU2001', 'Maya', 'Maya Patel', 'maya@example.com', 'student', 'Computer Science', '1st Year');

INSERT INTO students (id, name, email, department, year)
VALUES ('STU2001', 'Maya Patel', 'maya@example.com', 'Computer Science', '1st Year');

-- Update a record.
UPDATE students SET department = 'Information Technology' WHERE id = 'STU2001';

-- Delete a student profile and linked records (foreign keys cascade).
DELETE FROM users WHERE id = 'STU2001';
```

The website writes snapshots of its records to SQLite. Avoid editing the database directly while using the website; a later website save may replace those changes. Close the app server before making manual edits, then refresh/restart the app.

### Back up and exit

At the SQLite prompt, create a backup:

```sql
.backup campuscore-backup.db
.quit
```

The app's **Export Data** button downloads a JSON data export. SQLite's `.backup` command creates a copy of the full database file.

## Current design and limitations

SQLite is a good fit for a coursework project and a single-computer demo: it is relational, easy to query, and needs no separate database service. For a real hosted website used by multiple people, PostgreSQL would be a better choice, with a production web framework, server-side sessions/authorization, password hashing, request validation, and migrations. This API binds to `127.0.0.1` and should not be exposed publicly. Passwords are currently stored as plain text for demo purposes, so do not use real credentials.
