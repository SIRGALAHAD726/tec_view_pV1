import React, { useState } from 'react';
import { db, ref, set, push,get} from '../firebase_database/firebase'; // Asegúrate de que importes las funciones de Firebase
import { useNavigate } from 'react-router-dom';
import "../styles/Loginconfirmation.scss";

const LoginConfirmation = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!email || !password) {
      setError('Por favor ingrese un correo y una contraseña');
      return;
    }

    // Normalizamos los valores de email y password (eliminar espacios y poner en minúsculas)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Referencia a los usuarios en Firebase
    const usersRef = ref(db, 'users'); // Referencia a la base de datos de usuarios
    
    get(usersRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const users = snapshot.val();
          let userFound = false;

          // Recorremos todos los usuarios para verificar el correo y la contraseña
          for (const userId in users) {
            const user = users[userId];
            const userEmail = user.email ? user.email.trim().toLowerCase() : '';
            const userPassword = user.password ? user.password.trim() : '';

            // Comparamos los datos de forma insensible a mayúsculas y minúsculas y sin espacios
            if (userEmail === normalizedEmail && userPassword === normalizedPassword) {
              userFound = true;

              // Guardamos el usuario en el estado o en localStorage
              setUser(user);
              localStorage.setItem('user', JSON.stringify(user));

              // Obtener el carrito temporal que guardamos antes
              const tempCarrito = JSON.parse(localStorage.getItem('tempCarrito'));

              if (tempCarrito && tempCarrito.length > 0) {
                // Crear un objeto con la información de la compra
                const compra = {
                  usuario: {
                    email: user.email,
                    name: user.name, // Aquí usamos el nombre del usuario que ya está en Firebase
                  },
                  productos: tempCarrito.map((producto) => ({
                    name: producto.name,
                    price: producto.price,
                    image: producto.image,
                  })),
                  total: tempCarrito.reduce((acc, producto) => acc + producto.price, 0),
                  fecha: new Date().toISOString(),
                };

                // Subir la compra a Firebase
                const comprasRef = ref(db, 'comprasRealizadas');
                const newCompraRef = push(comprasRef);

                set(newCompraRef, compra)
                  .then(() => {
                    alert('Compra exitosa');
                    localStorage.removeItem('tempCarrito'); // Limpiar el carrito después de la compra
                    navigate('/user'); // Redirigir a la página de ventas
                  })
                  .catch((error) => {
                    setError('Error al realizar la compra: ' + error.message);
                  });
              } else {
                setError('No se encontró el carrito de compras');
              }
              break;
            }
          }

          if (!userFound) {
            setError('Correo o contraseña incorrectos');
          }
        } else {
          setError('No se encontraron usuarios en la base de datos');
        }
      })
      .catch((error) => {
        console.error('Error al verificar el usuario:', error);
        setError(`Ocurrió un error al verificar el usuario: ${error.message}`);
      });
  };

  return (
 
      <div className="login-confirm-container">
        <div className="login-box">
          <h2>Inserte sus Credenciales para Confirmar su Compra</h2>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button onClick={handleLogin}>Confirmar Compra</button>
        </div>
      </div>
    );
  
};

export default LoginConfirmation;
