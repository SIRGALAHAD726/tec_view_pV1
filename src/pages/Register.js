import React, { useState } from "react";
import { db, ref, set, get } from "../firebase_database/firebase"; // Asegúrate de la ruta correcta
import { useNavigate } from "react-router-dom";
import '../register.scss'; // Asegúrate de que esto esté en tu archivo principal

const Register = () => {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // Estado para el mensaje de éxito
  const navigate = useNavigate();

  // Función para validar la contraseña
  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  // Función para obtener la hora actual de Perú
  const getPeruTime = () => {
    const options = {
      timeZone: 'America/Lima', // Zona horaria de Perú
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    const peruTime = new Intl.DateTimeFormat('es-PE', options).format(new Date());
    return peruTime;
  };

  // Función para obtener la IP pública del usuario
  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error al obtener la IP:", error);
      return "IP no disponible";
    }
  };

  // Función para detectar el dispositivo
  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("android")) {
      return "Android";
    } else if (userAgent.includes("windows") || userAgent.includes("macintosh")) {
      return "PC";
    }
    return "Desconocido";
  };

  // Función para verificar si el DNI o el correo ya existen
  const checkExistingData = async () => {
    try {
      const userRef = ref(db, "users/" + dni); // Referencia a la base de datos usando el DNI como clave única
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return "DNI ya registrado";
      }

      const emailRef = ref(db, "users"); // Buscamos en todos los usuarios
      const emailSnapshot = await get(emailRef);

      let emailExists = false;
      emailSnapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().email === email) {
          emailExists = true;
        }
      });

      if (emailExists) {
        return "Correo electrónico ya registrado";
      }

      return null; // No hay conflictos
    } catch (error) {
      console.error("Error al verificar los datos:", error);
      return "Error al verificar datos.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar los campos
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!validatePassword(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }
    if (email !== confirmEmail) {
      setError("Los correos no coinciden.");
      return;
    }

    setError(""); // Limpiar error

    // Verificar si el DNI o el correo electrónico ya están registrados
    const existingDataError = await checkExistingData();
    if (existingDataError) {
      setError(existingDataError); // Mostrar el error si ya existe
      return;
    }

    // Obtener hora, IP y tipo de dispositivo
    const currentTime = getPeruTime();
    const userIP = await getUserIP();
    const deviceType = getDeviceType();

    // Referencia a la base de datos
    const userRef = ref(db, "users/" + dni); // Usamos el DNI como clave única

    try {
      // Guardar los datos del usuario en Realtime Database (con nombres en inglés)
      await set(userRef, {
        name: name, // Guardar como "firstName"
        lastName: lastName, // Guardar como "lastName"
        dni: dni, // Guardar el DNI
        email: email, // Guardar como "email"
        password: password, // Guardar como "password"
        role: "cliente", // Definir el rol por defecto como 'client'
        registrationDate: currentTime, // Guardamos la hora de registro
        ip: userIP, // Guardamos la IP del usuario
        device: deviceType, // Guardamos el tipo de dispositivo (Android/PC)
      });

      // Establecer el mensaje de éxito
      setSuccessMessage("¡Registro exitoso! Ahora puedes iniciar sesión.");

      // Redirigir al login después de un corto período para mostrar el mensaje
      setTimeout(() => {
        navigate("/"); // Esperar 2 segundos antes de redirigir al login
      }, 2000);
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setError("Error al registrar usuario. Intenta nuevamente.");
    }
  };

  return  (
    <div className="container">
    <div>
      
   
<div class="terminal">
  <div class="terminal-header">
    <div class="buttons">
      <span class="close"></span>
      <span class="minimize"></span>
      <span class="maximize"></span>
    </div>
    <div class="title">TECNOLOGY VIEW PERU</div>
  </div>
  <div class="terminal-body">
    <div class="terminal-loader">
      <span class="loader-text">REGISTRANDO</span>
      <span id="dot1" class="dot">.</span>
      <span id="dot2" class="dot">.</span>
      <span id="dot3" class="dot">.</span>
    </div>
  </div>
</div>




      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Confirmar Correo electrónico"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Registrar</button>
      </form>
  
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
  
      <p>¿Ya tienes una cuenta? <a href="/">Inicia sesión</a></p>
    </div>
  </div>
  );
};


export default Register;
