import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import VentasPage from "./pages/VentasPage"; // Página de cliente
import AdminPage from "./pages/AdminPage"; // Página de admin
import ProtectedRoute from "./ProtectedRoute";
import LoginConfirmation from "./pages/LoginConfirmation"; // Aquí debe ser importado correctamente
import Register from "./pages/Register";

function App() {
  const [user, setUser] = useState(null); // Guarda el usuario autenticado

  // Recuperar usuario desde localStorage si existe
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Ruta para la página de Login */}
        <Route path="/" element={<Login setUser={setUser} />} />

        {/* Ruta para la página de registro */}
        <Route path="/register" element={<Register />} />

        {/* Ruta para la página de ventas (solo accesible para clientes autenticados) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute user={user} role="cliente">
              <VentasPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta para la página de administración (solo accesible para admins autenticados) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta para la confirmación de login (antes de hacer la compra) */}
        <Route path="/loginconfirmation" element={<LoginConfirmation setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;
