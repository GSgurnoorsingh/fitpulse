# ⚡ FITPULSE

<p align="center">
  <b>Your Personalized Fitness Companion</b><br>
  Generate customized workout routines and diet plans based on your fitness goals.
</p>

<p align="center">
  <a href="https://fitpulse-gilt.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Visit%20Website-success?style=for-the-badge"></a>
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge">
</p>

---

# 🌐 Live Demo

👉 **https://fitpulse-gilt.vercel.app/**

---

# 📖 About FITPULSE

**FITPULSE** is a full-stack, responsive fitness planning web application designed to simplify the process of creating personalized workout and diet plans.

Instead of manually calculating calories or building workout routines, users simply enter their body metrics and fitness goals. The application automatically generates:

- 🥗 Personalized daily meal plans
- 🔥 Target calorie distribution
- 💪 Customized workout schedules
- 🏠 Home Calisthenics routines
- 🏋️ Gym-based training splits

The application combines a modern React frontend with an Express.js backend and PostgreSQL database to provide a fast, dynamic, and scalable fitness planning experience.

---

# ✨ Features

## 🔐 Persistent User Authentication

- Secure user registration and login
- Session persistence using localStorage
- Automatic login restoration after page refresh
- Protected user dashboard

---

## 📊 Automated Fitness Metrics

- Calculates BMI instantly
- Stores user profile securely
- Eliminates repeated data entry
- Automatically redirects returning users to their dashboard

---

## 🥗 Dynamic Diet Planner

Generates personalized meal plans based on:

- Fitness Goal
- Weight
- Height
- BMI

Meal categories include:

- 🍳 Breakfast
- 🍛 Lunch
- 🍽 Dinner
- 🥜 High Protein Snacks

Each plan includes customized calorie allocation for better nutrition planning.

---

## 💪 Intelligent Workout Generator

Automatically creates workout schedules for:

- 🏠 Home Calisthenics
- 🏋️ Commercial Gym

The backend uses PostgreSQL window functions:

```sql
ROW_NUMBER() OVER (
PARTITION BY day_of_week
ORDER BY RANDOM()
)
```

This ensures:

- Random exercise selection
- Balanced routines
- No duplicate workouts
- 5–6 exercises per training day

---

## 🔄 One Click Plan Regeneration

Don't like the generated plan?

Simply regenerate:

- Workout Schedule
- Diet Plan
- Exercise Combinations

without creating a new account.

---

## 📱 Fully Responsive UI

Designed using a modern **Glassmorphism Dark Theme** featuring:

- Desktop optimization
- Tablet responsiveness
- Mobile-friendly layouts
- Smooth user experience

---

# 🛠 Tech Stack

## Frontend

- React (Vite)
- Axios
- CSS3
- Responsive Flexbox & Grid

---

## Backend

- Node.js
- Express.js
- REST APIs
- Dotenv

---

## Database

- PostgreSQL

---

## Deployment

- Vercel (Frontend)
- Render (Backend)
- PostgreSQL Cloud Database

---

# 📂 Project Structure

```text
FITPULSE
│
├── fitness-backend/
│   ├── db.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── components/
│
├── public/
│
├── package.json
└── README.md
```

---

# ⚙ Local Installation

## Prerequisites

Make sure you have installed:

- Node.js
- PostgreSQL
- npm

---

# 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/FITPULSE.git

cd FITPULSE
```

---

# 2️⃣ Database Setup

Create the following tables inside PostgreSQL.

## Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
```

---

## Profiles Table

```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2) NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    bmi NUMERIC(4,2),
    training_environment VARCHAR(20) NOT NULL,
    fitness_goal VARCHAR(20)
);
```

---

## Workouts Table

```sql
CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20),
    day_of_week VARCHAR(15),
    exercise_name VARCHAR(100),
    sets INT,
    reps INT
);
```

---

## Diet Table

```sql
CREATE TABLE diets (
    id SERIAL PRIMARY KEY,
    goal_category VARCHAR(20),
    meal_type VARCHAR(20),
    meal_name VARCHAR(150),
    calories INT
);
```

---

# 3️⃣ Backend Setup

Navigate to the backend folder.

```bash
cd fitness-backend

npm install
```

Create a **.env** file.

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fitness_planner_db
DB_PASSWORD=your_secure_password
DB_PORT=5432

PORT=5000
```

Start the backend server.

```bash
node server.js
```

---

# 4️⃣ Frontend Setup

Return to the project root.

```bash
npm install

npm run dev
```

---

# ☁ Deployment

| Service | Platform |
|----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | PostgreSQL |

---

# 🌍 Production Configuration

FITPULSE supports both local and production environments.

### Local Development

Uses PostgreSQL credentials stored in the local `.env` file.

### Production

Automatically switches to the hosted PostgreSQL database using:

```env
DATABASE_URL
```

The backend securely enables SSL connections for production deployments.

```javascript
ssl: {
    rejectUnauthorized: false
}
```

---

# 🚀 Future Improvements

- 📈 Progress Tracking
- 📅 Workout History
- ❤️ Favorite Meals
- 📊 Nutrition Charts
- 🤖 AI-powered Workout Suggestions
- 🍎 Macro Tracking
- 📱 PWA Support
- 📤 Export Workout Plans as PDF

---

# 🤝 Contributing

Contributions are always welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push your branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Gurnoor Singh**

Computer Science Engineering (AI & ML)

Built with ❤️ using React, Express, Node.js, and PostgreSQL.

---

<p align="center">
⭐ If you liked this project, consider giving it a star on GitHub!
</p>
