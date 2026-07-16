import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";

function App() {
  // 1. Initialize user state using a lazy initializer reading from localStorage memory bounds
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("fitpulse_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Default tracking viewport defaults cleanly to a checking state if a session token persists
  const [view, setView] = useState(() => {
    return localStorage.getItem("fitpulse_user") ? "gateway_check" : "home";
  });

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [environment, setEnvironment] = useState("Home");

  const [profile, setProfile] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [diet, setDiet] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);

  // 3. Automated check run upon page reloading instance
  useEffect(() => {
    if (user) {
      checkExistingMetrics(user.id);
    }
  }, []);

  const checkExistingMetrics = async (userId) => {
    try {
      // Hits the profile routing validation endpoint
      const pRes = await axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/profile-check/${userId}`);
      if (pRes.data.exists) {
        setProfile(pRes.data.profile);
        
        // Populate inputs with current metrics so updating is seamless
        setWeight(pRes.data.profile.weight_kg);
        setHeight(pRes.data.profile.height_cm);
        setEnvironment(pRes.data.profile.training_environment);

        // Pre-fetch downstream plans concurrently
        const [wRes, dRes, tRes] = await Promise.all([
          axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/workout/${userId}`),
          axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/diet/${userId}`),
          axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/timeline/${userId}`),
        ]);

        setWorkout(wRes.data);
        setDiet(dRes.data.diet_plan);
        setTimeline(tRes.data);
        setView("gateway");
      } else {
        setView("survey");
      }
    } catch (err) {
      setView("home");
    }
  };

  // Login/Registration route operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    const endpoint = isRegisterMode ? "register" : "login";
    try {
      const res = await axios.post(`https://my-fitness-app-backend-73tz.onrender.com/api/${endpoint}`, {
        username,
        password,
      });
      const loggedUser = res.data.user;
      setUser(loggedUser);
      localStorage.setItem("fitpulse_user", JSON.stringify(loggedUser)); // Store session details
      checkExistingMetrics(loggedUser.id);
    } catch (err) {
      alert(err.response?.data?.error || "Connection error with auth server");
    }
  };

  // Metrics submission data handler (handles creation & dynamic overwrites via ON CONFLICT)
  const handleMetricsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profileRes = await axios.post("https://my-fitness-app-backend-73tz.onrender.com/api/profile", {
        user_id: user.id,
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
        training_environment: environment,
      });
      setProfile(profileRes.data.profile);

      const [wRes, dRes, tRes] = await Promise.all([
        axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/workout/${user.id}`),
        axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/diet/${user.id}`),
        axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/timeline/${user.id}`),
      ]);

      setWorkout(wRes.data);
      setDiet(dRes.data.diet_plan);
      setTimeline(tRes.data);
      setView("gateway");
    } catch (err) {
      alert("Error building automated metrics layout");
    } finally {
      setLoading(false);
    }
  };

  const handleRerollDiet = async () => {
    try {
      const res = await axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/diet/${user.id}`);
      setDiet(res.data.diet_plan);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fitpulse_user");
    setUser(null);
    setProfile(null);
    setWorkout(null);
    setDiet(null);
    setTimeline(null);
    setView("home");
  };

  const handleCallToAction = () => {
    if (user) {
      setView(profile ? "gateway" : "survey");
    } else {
      setView("auth");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER ELEMENT */}
      <header className="glass-header">
        <div
          className="brand-logo"
          onClick={() => setView(user ? (profile ? "gateway" : "survey") : "home")}
          style={{ cursor: "pointer" }}
        >
          ⚡ FITPULSE
        </div>
        <div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#ef4444" }}>
                🔴 Welcome, {user.username.toUpperCase()}
              </span>
              <button 
                style={{ width: "auto", padding: "0.4rem 1.25rem", background: "rgba(255,255,255,0.1)", fontSize: "0.9rem" }} 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              style={{ width: "auto", padding: "0.5rem 1.5rem" }}
              onClick={() => {
                setIsRegisterMode(false);
                setView("auth");
              }}
            >
              Login/Register
            </button>
          )}
        </div>
      </header>

      {/* CORE CONTENT ROUTING VIEWPORTS */}
      <main className="app-container" style={{ flex: 1 }}>
        
        {/* VIEW 0: LOADING SPLASH GUARD FOR VERIFIED SESSIONS */}
        {view === "gateway_check" && (
          <div style={{ textAlign: "center", marginTop: "6rem", color: "var(--text-muted)" }}>
            <h2>Initializing Encrypted Session Pipelines...</h2>
          </div>
        )}

        {/* MODULE 1: LANDING HERO SYSTEM PAGE */}
        {view === "home" && (
          <div>
            <section className="hero-section animate-hero-text">
              <h1 className="hero-giant-title">
                Forge Your Body
                <br />
                Control Your <span>Destiny</span>
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "1.2rem",
                  maxWidth: "600px",
                  margin: "0 auto 2.5rem auto",
                }}
              >
                Track your metrics, generate your customized nutritional splits,
                and deploy elite workout strategies instantly.
              </p>
              <button
                style={{
                  maxWidth: "320px",
                  fontSize: "1.1rem",
                  padding: "1.2rem",
                }}
                onClick={handleCallToAction}
              >
                Get Your Custom Fitness Plan Today
              </button>
            </section>

            <section className="quotes-grid">
              <div className="quote-card">
                <p>
                  "The only bad workout is the one that didn't happen.
                  Consistency beats intensity every single execution window."
                </p>
              </div>
              <div className="quote-card">
                <p>
                  "Obsession will always conquer talent. When you feel like
                  dropping weights, remember why you initialized your profiles."
                </p>
              </div>
              <div className="quote-card">
                <p>
                  "Your body is a data architecture. Program it with clean
                  nutrition and calculated hyper-volume mechanical strain."
                </p>
              </div>
            </section>
          </div>
        )}

        {/* MODULE 2: AUTHENTICATION PORTAL TERMINAL */}
        {view === "auth" && (
          <div className="card" style={{ maxWidth: "420px", margin: "4rem auto 0 auto" }}>
            <h2>{isRegisterMode ? "Register Profile" : "Access Console"}</h2>
            <form onSubmit={handleAuthSubmit}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">
                {isRegisterMode ? "Register Now" : "Authorize Entry"}
              </button>
            </form>
            <button
              className="btn-secondary"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode ? "Switch to Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        )}

        {/* MODULE 3: METRICS PROFILE PARAMETERS SURVEY */}
        {view === "survey" && (
          <div className="card" style={{ maxWidth: "500px", margin: "2rem auto 0 auto" }}>
            <h2>Biometric Data Target Gathering</h2>
            <form onSubmit={handleMetricsSubmit}>
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
              <label>Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
              <label>Training Space Configuration</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="Home">🏠 Home Workouts (Calisthenics Split)</option>
                <option value="Gym">🏢 Commercial Gym (Barbells and Machine Access)</option>
              </select>
              <button type="submit" disabled={loading}>
                {loading ? "Running Profilers..." : "Verify System Allocation"}
              </button>
            </form>
            {profile && (
              <button 
                className="btn-secondary" 
                style={{ marginTop: "1rem" }} 
                onClick={() => setView("gateway")}
              >
                Cancel / Return to Gateway
              </button>
            )}
          </div>
        )}

        {/* MODULE 4: DUAL SPLIT GATEWAY VIEW */}
        {view === "gateway" && profile && (
          <div>
            <div className="card" style={{ textAlign: "center" }}>
              <h2 style={{ color: "var(--accent)", margin: 0, textTransform: "uppercase" }}>
                Metrics Successfully Calculated
              </h2>
              <p style={{ fontSize: "1.3rem", margin: "1rem 0" }}>
                Current BMI: <strong>{profile.bmi}</strong>
              </p>
              <p style={{ color: "var(--text-muted)" }}>
                Target Scope: Hit {timeline?.target_weight} within {timeline?.estimated_time}
              </p>
            </div>

            <div className="btn-split-container">
              <button className="action-card-btn" onClick={() => setView("diet")}>
                🥗 <br /><br />Get a Meal Plan
              </button>
              <button className="action-card-btn" onClick={() => setView("workout")}>
                🏋️‍♂️ <br /><br />Get Workout Plan
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button
                className="btn-secondary"
                style={{ maxWidth: "300px", border: "1px dashed var(--accent)" }}
                onClick={() => setView("survey")}
              >
                ⚙️ Update Metrics
              </button>
            </div>
          </div>
        )}

        {/* MODULE 5: ISOLATED WORKOUT PLAN WEEKLY CONTAINER */}
        {view === "workout" && workout && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2>Training Allocation Summary ({workout.environment} Split)</h2>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setView("survey")} style={{ width: "auto", background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem" }}>⚙️ Update Metrics</button>
                <button onClick={() => setView("gateway")} style={{ width: "auto", padding: "0.5rem 1.5rem" }}>Back</button>
              </div>
            </div>

            {workout.schedule.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>
                No workout routine generated. Please ensure your database tables are seeded.
              </p>
            ) : (
              <div>
                {/* Dynamically reads array to frame exact days present */}
                {[...new Set(workout.schedule.map((ex) => ex.day_of_week))].map((day) => (
                  <div
                    key={day}
                    style={{
                      marginBottom: "1.75rem",
                      background: "rgba(0,0,0,0.3)",
                      padding: "1.25rem",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <h3
                      style={{
                        color: "var(--accent)",
                        margin: "0 0 0.75rem 0",
                        borderBottom: "1px solid rgba(220, 38, 38, 0.2)",
                        paddingBottom: "0.4rem",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      📅 {day} Routine
                    </h3>

                    {/* Filters structural movements strictly assigned to current loop container day */}
                    {workout.schedule
                      .filter((ex) => ex.day_of_week === day)
                      .map((ex, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "0.5rem 0",
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px dashed rgba(255,255,255,0.05)",
                          }}
                        >
                          <span style={{ fontWeight: "600" }}>🎯 {ex.exercise_name}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                            {ex.sets} sets × {ex.reps} reps
                          </span>
                        </div>
                      ))}
                  </div>
                ))}

                <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                  <button
                    onClick={async () => {
                      try {
                        const res = await axios.get(`https://my-fitness-app-backend-73tz.onrender.com/api/workout/${user.id}`);
                        setWorkout(res.data);
                      } catch (err) {
                        alert("Failed to randomize new training routine variations.");
                      }
                    }}
                    style={{ background: "#10b981" }}
                  >
                    🔄 Generate Another Workout Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE 6: ISOLATED DIET BLOCKS SHEET CONTAINER */}
        {view === "diet" && diet && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2>Dynamic Calorie Target Sheet</h2>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setView("survey")} style={{ width: "auto", background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem" }}>⚙️ Update Metrics</button>
                <button onClick={handleRerollDiet} style={{ background: "#10b981", width: "auto", padding: "0.5rem 1.5rem" }}>Reroll</button>
                <button onClick={() => setView("gateway")} style={{ width: "auto", padding: "0.5rem 1.5rem" }}>Back</button>
              </div>
            </div>
            {diet.map((meal, index) => (
              <div key={index} className="meal-item">
                <span style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--accent)" }}>
                  {meal.meal_type.toUpperCase()}
                </span>
                <h3 style={{ margin: "0.2rem 0" }}>{meal.meal_name}</h3>
                <span style={{ color: "var(--text-muted)" }}>
                  Target Calorie Load: {meal.calories} kcal
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER ANCHOR COMPONENT */}
      <footer className="glass-footer">
        <div>
          © 2026 FITPULSE System Engines. Engineered for responsive mobile execution. Data pipeline optimized.
        </div>
      </footer>
    </div>
  );
}

export default App;
