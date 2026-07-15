import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// 1. REGISTER ROUTE
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists." });
    }
    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, password],
    );
    res.json({ message: "Registration successful!", user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. LOGIN ROUTE
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userRes = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password],
    );
    if (userRes.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid username or password credentials." });
    }
    res.json({
      message: "Login successful!",
      user: { id: userRes.rows[0].id, username: userRes.rows[0].username },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. PROFILE METRIC SURVEY ROUTE (Saves configuration parameters)
app.post("/api/profile", async (req, res) => {
  try {
    const { user_id, weight_kg, height_cm, training_environment } = req.body;
    const heightInMeters = height_cm / 100;
    const bmi = (weight_kg / (heightInMeters * heightInMeters)).toFixed(1);
    const fitness_goal = bmi < 24.9 ? "Gain" : "Lose";

    const profileRes = await pool.query(
      `INSERT INTO profiles (user_id, weight_kg, height_cm, bmi, fitness_goal, training_environment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) 
       DO UPDATE SET weight_kg = EXCLUDED.weight_kg, height_cm = EXCLUDED.height_cm, bmi = EXCLUDED.bmi, fitness_goal = EXCLUDED.fitness_goal, training_environment = EXCLUDED.training_environment
       RETURNING *`,
      [user_id, weight_kg, height_cm, bmi, fitness_goal, training_environment],
    );

    res.json({
      message: "Metrics updated successfully!",
      profile: profileRes.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/profile-check/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);
    
    if (profileRes.rows.length > 0) {
      res.json({ exists: true, profile: profileRes.rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 4. WORKOUT ROUTE (Now filters conditionally by Gym vs Home environment parameters)
app.get("/api/workout/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const profileRes = await pool.query(
      "SELECT fitness_goal, training_environment FROM profiles WHERE user_id = $1",
      [user_id],
    );

    if (profileRes.rows.length === 0)
      return res
        .status(404)
        .json({ error: "Profile profile details missing." });
    const { fitness_goal, training_environment } = profileRes.rows[0];

    const workoutRes = await pool.query(
      `SELECT day_of_week, exercise_name, sets, reps 
      FROM(
      SELECT day_of_week,exercise_name,sets,reps,
      ROW_NUMBER() OVER (PARTITION BY day_of_week ORDER BY RANDOM()) as rn
      FROM workouts
      WHERE goal_category=$1
      AND environment=$2
      )subquery
      WHERE rn<=6
      ORDER BY
      CASE day_of_week
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7
      END,rn;`,
      [fitness_goal, training_environment],
    );

    res.json({
      goal: fitness_goal,
      environment: training_environment,
      schedule: workoutRes.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 5. DIET GENERATION ROUTE
app.get("/api/diet/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const profileRes = await pool.query(
      "SELECT fitness_goal FROM profiles WHERE user_id = $1",
      [user_id],
    );
    if (profileRes.rows.length === 0)
      return res.status(404).json({ error: "Profile missing." });
    const goal = profileRes.rows[0].fitness_goal;

    const mealsRes = await pool.query(
      `
      (SELECT meal_type, meal_name, calories FROM diets WHERE goal_category = $1 AND meal_type = 'Breakfast' ORDER BY RANDOM() LIMIT 1)
      UNION ALL
      (SELECT meal_type, meal_name, calories FROM diets WHERE goal_category = $1 AND meal_type = 'Lunch' ORDER BY RANDOM() LIMIT 1)
      UNION ALL
      (SELECT meal_type, meal_name, calories FROM diets WHERE goal_category = $1 AND meal_type = 'Dinner' ORDER BY RANDOM() LIMIT 1)
      UNION ALL
      (SELECT meal_type, meal_name, calories FROM diets WHERE goal_category = $1 AND meal_type='Snacks' ORDER BY RANDOM() LIMIT 1)
    `,
      [goal],
    );

    res.json({ goal, diet_plan: mealsRes.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 6. TIMELINE ENGINE ROUTE
app.get("/api/timeline/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const profileRes = await pool.query(
      "SELECT weight_kg, height_cm, bmi, fitness_goal FROM profiles WHERE user_id = $1",
      [user_id],
    );
    if (profileRes.rows.length === 0)
      return res.status(404).json({ error: "Profile missing." });

    const { weight_kg, height_cm, bmi, fitness_goal } = profileRes.rows[0];
    const heightM = height_cm / 100;
    let targetW = weight_kg;
    let weeks = 0;

    if (fitness_goal === "Gain") {
      targetW = (19.0 * (heightM * heightM)).toFixed(1);
      weeks = Math.ceil((targetW - weight_kg) / 0.5);
    } else {
      targetW = (24.0 * (heightM * heightM)).toFixed(1);
      weeks = Math.ceil((weight_kg - targetW) / 0.5);
    }
    if (weeks < 0) weeks = 0;

    res.json({
      current_bmi: bmi,
      target_weight: `${targetW} kg`,
      estimated_time: `${weeks} weeks`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});