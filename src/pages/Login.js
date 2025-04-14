import React, { useState, useEffect } from "react";
import { db, ref, get } from "../firebase_database/firebase"; // Asegúrate de la ruta correcta
import { useNavigate } from "react-router-dom";
import "../styles/Login.scss"; // Asegúrate de que esto esté en tu archivo principal

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [squares, setSquares] = useState([]);
  const navigate = useNavigate();
  const maxSquares = 15; // Límite de cuadros (ajustar según necesidad)

  useEffect(() => {
    // Generar rombos de manera aleatoria
    const interval = setInterval(() => {
      if (squares.length < maxSquares) {  // Verifica si no se ha alcanzado el límite
        setSquares((prev) => [
          ...prev,
          {
            id: prev.length,
            left: Math.random() * 100 + "vw", // Posición aleatoria
            animationDelay: Math.random() * 5 + "s", // Delay aleatorio
          },
        ]);
      }
    }, 500); // Cada 500ms se agrega un nuevo rombo

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar
  }, [squares]); // Dependencia de `squares` para actualizar el estado

  const handleLogin = async (e) => {
    e.preventDefault();
    const usersRef = ref(db, "users");

    try {
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        let userFound = null;

        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.email === email && userData.password === password) {
            userFound = { id: childSnapshot.key, ...userData };
          }
        });

        if (userFound) {
          localStorage.setItem("user", JSON.stringify(userFound));
          setUser(userFound); // Actualiza el estado del usuario
          if (userFound.role === "admin") {
            navigate("/admin"); // Redirige a la página de admin
          } else if (userFound.role === "cliente") {
            navigate("/user"); // Redirige a la página de cliente
          }
        } else {
          alert("Credenciales incorrectas");
        }
      } else {
        alert("No hay usuarios registrados");
      }
    } catch (error) {
      console.error("Error en la autenticación:", error);
      alert("Error al conectar con la base de datos");
    }
  };

  // Función para redirigir al formulario de registro
  const handleRegisterRedirect = () => {
    navigate("/register"); // Redirige a la página de registro
  };

  return (
    <div className="login-container">
      <div className="login-box">
      <h2>TECNOLOGY VIEW PERU</h2>
        <h2>Iniciar sesión</h2>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Iniciar sesión</button>
        </form>

        <button className="register-btn" onClick={handleRegisterRedirect}>
          ¿No tienes cuenta? Regístrate
        </button>
      </div>

      {/* Efecto de rombos cayendo */}
      <div className="falling-squares">
        {squares.map((square) => (
          <div
            className="square"
            key={square.id}
            style={{
              left: square.left,
              animationDelay: square.animationDelay,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Login;
