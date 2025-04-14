import React from 'react';
import '../styles/Modal.css'; // Asegúrate de que tienes estilos para el modal
import { useNavigate } from 'react-router-dom'; // Importamos para navegar entre páginas

const CarritoModal = ({ isOpen, closeModal, carrito }) => {
  const navigate = useNavigate();

  if (!isOpen) return null; // Si el modal no está abierto, no se muestra

  const handleBuyClick = () => {
    if (carrito.length > 0) {
      // Guardamos el carrito temporalmente en el localStorage antes de redirigir
      localStorage.setItem('tempCarrito', JSON.stringify(carrito));

      // Redirigimos a la página de Login de Confirmación
      navigate('/loginconfirmation');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Botón de Cierre dentro del contenido */}
        <div className="modal-header">
          <button className="modal-close" onClick={closeModal}>X</button>
        </div>
        
        <h2>Tu Carrito de Compras</h2>
        {carrito.length > 0 ? (
          <div>
            {carrito.map((producto, index) => (
              <div key={index} className="carrito-item">
                <img src={producto.image} alt={producto.name} width="50" />
                <span>{producto.name}</span>
                <span>${producto.price}</span>
              </div>
            ))}
            <div className="total">
              <strong>Total: S/.{carrito.reduce((acc, producto) => acc + producto.price, 0)}</strong>
            </div>
            {/* Botón de comprar */}
            <button className="buy-now-button" onClick={handleBuyClick}>
              Comprar
            </button>
          </div>
        ) : (
          <p>Tu carrito está vacío.</p>
        )}
      </div>
    </div>
  );
};

export default CarritoModal;
