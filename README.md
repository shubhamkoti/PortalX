# 🚀 AI Powered Internship & Job Recommendation Portal

An intelligent web platform that automatically analyzes a student's resume, extracts skills, and recommends relevant internships and job opportunities in real-time.

> Stop searching for jobs ❌
> Let jobs find you ✅

---

## 📌 Problem Statement

Students often struggle to find relevant internships because:

* They don’t know which roles match their skills
* They manually search across multiple platforms
* Many opportunities are missed
* Recruiters receive too many irrelevant applications

---

## 💡 Solution

This platform acts as a smart bridge between students and recruiters.

Instead of students searching for jobs, the system automatically:

1. Reads the student's resume
2. Extracts skills
3. Matches them with job requirements
4. Instantly notifies the student

---

## 🧠 Features

### 👤 Student Side

* Secure Authentication
* Resume Upload (PDF)
* Automatic Skill Extraction
* Profile Completion Score
* Smart Job Recommendations
* Real-time Alerts for matching jobs
* One-click Apply

### 🏢 Recruiter Side

* Company Registration
* Post Jobs / Internships
* Add Required Skills
* View Matched Candidates
* Filter Relevant Applicants

### 🤖 AI Matching Engine

* Skill based recommendation
* Matching percentage calculation
* Automatic user notification
* Reduces irrelevant applications

---

## ⚙️ Working Flow

1. Student uploads resume
2. System parses resume and extracts skills
3. Skills stored in database
4. Recruiter posts job with required skills
5. Matching engine compares student skills with job skills
6. If match ≥ threshold → notification sent to student

---

## 🛠 Tech Stack

### Frontend

* HTML
* CSS
* JavaScript
* React.js

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Tools & Libraries

* Multer (File Upload)
* PDF Parser (Resume extraction)
* JWT Authentication
* Nodemailer (Email Notifications)
* Git & GitHub

---

## 📊 Matching Algorithm

Matching Score =
(Number of matching skills / Total required job skills) × 100

If score > 60% → Recommended to user

---

## 🔐 Security

* JWT based authentication
* Protected API routes
* Input validation
* Secure file upload handling

---

## 📂 Folder Structure

```
project-root/
│── client/
│── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
│── uploads/
│── README.md
```

---

## 🚀 Installation

### 1. Clone Repository

```
git clone <YOUR_REPO_URL>
cd project-folder
```

### 2. Backend Setup

```
cd server
npm install
npm run dev
```

### 3. Frontend Setup

```
cd client
npm install
npm start
```

---

## 🌟 Future Improvements

* AI resume improvement suggestions
* Chatbot career assistant
* Resume ATS score checker
* Skill gap analysis
* Interview preparation module
* Mobile application

---

## 👨‍💻 Author

**YOUR NAME**

---

## 📜 License

Developed for educational & hackathon purposes.

---

## ❤️ Vision

Making job searching smarter, faster and automatic for students.
