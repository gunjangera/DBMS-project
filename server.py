"""CampusCore SQLite API. Run with: python3 server.py"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sqlite3
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "campuscore.db"


def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def init_db():
    with connect() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, password TEXT NOT NULL, name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
                department TEXT NOT NULL DEFAULT '', year TEXT, designation TEXT, phone TEXT
            );
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL, email TEXT NOT NULL, department TEXT NOT NULL, year TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS teachers (
                id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL, email TEXT NOT NULL, department TEXT NOT NULL,
                designation TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY, studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                subject TEXT NOT NULL, marks REAL NOT NULL CHECK(marks >= 0 AND marks <= 100)
            );
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY, studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                date TEXT NOT NULL, status TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_reports_student ON reports(studentId);
            CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(studentId, date);
        """)


def get_state(db):
    def rows(sql):
        return [dict(row) for row in db.execute(sql).fetchall()]
    return {
        "users": rows("SELECT * FROM users"),
        "students": rows("SELECT * FROM students"),
        "teachers": rows("SELECT * FROM teachers"),
        "reports": rows("SELECT * FROM reports"),
        "attendance": rows("SELECT * FROM attendance"),
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlparse(self.path).path == "/api/state":
            with connect() as db:
                self.send_json(200, get_state(db))
            return
        super().do_GET()

    def do_PUT(self):
        if urlparse(self.path).path != "/api/state":
            self.send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            state = json.loads(self.rfile.read(length))
            with connect() as db:
                db.execute("BEGIN")
                # Replace as one transaction so related records remain consistent.
                for table in ("attendance", "reports", "students", "teachers", "users"):
                    db.execute(f"DELETE FROM {table}")
                for user in state.get("users", []):
                    db.execute("INSERT INTO users(id,password,name,email,role,department,year,designation,phone) VALUES(?,?,?,?,?,?,?,?,?)",
                        (user["id"], user.get("password", ""), user.get("name", ""), user.get("email", ""), user.get("role", "student"), user.get("department", ""), user.get("year"), user.get("designation"), user.get("phone")))
                for person in state.get("students", []):
                    db.execute("INSERT INTO students(id,name,email,department,year) VALUES(?,?,?,?,?)",
                        (person["id"], person.get("name", ""), person.get("email", ""), person.get("department", ""), person.get("year", "")))
                for person in state.get("teachers", []):
                    db.execute("INSERT INTO teachers(id,name,email,department,designation,phone) VALUES(?,?,?,?,?,?)",
                        (person["id"], person.get("name", ""), person.get("email", ""), person.get("department", ""), person.get("designation", ""), person.get("phone", "")))
                for row in state.get("reports", []):
                    db.execute("INSERT INTO reports(id,studentId,subject,marks) VALUES(?,?,?,?)",
                        (row["id"], row["studentId"], row.get("subject", ""), row.get("marks", 0)))
                for row in state.get("attendance", []):
                    db.execute("INSERT INTO attendance(id,studentId,date,status) VALUES(?,?,?,?)",
                        (row["id"], row["studentId"], row.get("date", ""), row.get("status", "")))
            self.send_json(200, {"ok": True})
        except (ValueError, KeyError, sqlite3.Error) as error:
            self.send_json(400, {"error": str(error)})


if __name__ == "__main__":
    init_db()
    print("CampusCore running at http://localhost:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
