
GlobeScholarship AI-POWERED SEARCH ENGINE PROGRAM

GlobeScholarship Access is an interactive platform that visualizes global scholarship availability through a 3D spinning globe.
It allows students to search for scholarships by country, save opportunities, and manage their profiles.
Built with FastAPI for the backend and HTML/CSS/JavaScript (D3.js + Three.js) for the frontend.

 Features
User Authentication
Signup & Login on separate pages
Secure password hashing & JWT authentication
Redirect to login page after signup
Scholarship Dashboard
Interactive 3D spinning globe with country selection
Dark, professional design with responsive layout
Search for scholarships by country
User Profile & Data
Personalized greeting (Welcome, First Name)
Navigation bar with:
Profile

How to Use
Saved Scholarships
Search
Logout
Database (SQLite)
Stores user info (first name, last name, email, password)
Saves user-selected scholarships

🛠️ Tech Stack
Frontend: HTML, CSS, JavaScript, D3.js / Three.js
Backend: FastAPI, SQLAlchemy, SQLite
Auth: JWT authentication, bcrypt password hashing
📂 Project Structure
globe-scholarship/
│── backend/
│   ├── main.py              # FastAPI entry point
│   ├── database.py          # SQLite + SQLAlchemy models
│   ├── auth.py              # Signup/Login logic
│   ├── schemas.py           # Pydantic models
│   ├── requirements.txt     # Python dependencies
│
│── frontend/
│   ├── index.html           # Login page
│   ├── signup.html          # Signup page
│   ├── dashboard.html       # Main dashboard w/ spinning globe
│   ├── css/
│   │   └── styles.css       # Styling
│   ├── js/
│   │   └── globe.js         # Globe visualization
│   │   └── scripts.js       # Frontend logic (auth, nav, etc.)
│
└── README.md
⚙️ Installation
1. Clone the repo
git clone https://github.com/richmondntow/globe-scholarship.git
cd globe-scholarship
2. Backend Setup
Create a virtual environment and install dependencies:
cd backend
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

pip install -r requirements.txt
Run the FastAPI server:
uvicorn main:app --reload --port 5000
Backend runs at: http://127.0.0.1:5000

3. Frontend Setup
Open frontend/index.html in your browser.
The frontend communicates with the backend via fetch API requests.

🔑 API Routes
POST /auth/signup – Register a new user
POST /auth/login – Authenticate & receive JWT token
GET /scholarships/{country} – Get scholarships for a country
POST /scholarships/save – Save a scholarship to user’s profile

🖥️ Usage
Open signup.html → create an account.
After signup, you’ll be redirected to index.html (login).
Log in with your credentials.
Access the dashboard with spinning globe + scholarship search.
Save scholarships to your personal list.

📌 Notes
Tokens are stored in localStorage for authentication.
You can enhance the globe with real-time scholarship listings via APIs.
Database defaults to SQLite (globe.db) but can be swapped for PostgreSQL/MySQL.

📜 License
MIT License – free to use & modify.
