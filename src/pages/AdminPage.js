import React, { useState, useEffect } from 'react';
import { db, ref, get, set, push } from '../firebase_database/firebase';
import "../styles/Adminpage.scss";

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visibleSection, setVisibleSection] = useState('productos');
  const [username, setUsername] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '', category: '', description: '', price: '', stock: '', image: ''
  });

  const [newPromotion, setNewPromotion] = useState({
    name: '', category: '', description: '', discount: '', image: '', price: '', stock: '', video: ''
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.name) {
      setUsername(storedUser.name);
    }

    fetchProducts();
    fetchPromotions();
    fetchUsers();
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const fetchProducts = async () => {
    try {
      const productsRef = ref(db, 'products/products');
      const snapshot = await get(productsRef);
      if (snapshot.exists()) {
        const productsList = Object.entries(snapshot.val()).map(([id, product]) => ({ id, ...product }));
        setProducts(productsList);
        const productCategories = productsList.map(product => product.category);
        const uniqueCategories = [...new Set(productCategories)];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const promotionsRef = ref(db, 'products/promotions');
      const snapshot = await get(promotionsRef);
      if (snapshot.exists()) {
        const promotionsList = Object.entries(snapshot.val()).map(([id, promo]) => ({ id, ...promo }));
        setPromotions(promotionsList);
      }
    } catch (error) {
      console.error('Error al obtener promociones:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersList = Object.entries(snapshot.val()).map(([id, user]) => ({ id, ...user }));
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const addProduct = async () => {
    const { name, category, description, price, stock, image } = newProduct;
    const newProductData = {
      name, category, description,
      price: parseFloat(price),
      stock: parseInt(stock),
      image
    };

    try {
      const productsRef = ref(db, 'products/products');
      const newProductRef = push(productsRef);
      await set(newProductRef, newProductData);
      setProducts(prev => [...prev, { ...newProductData, id: newProductRef.key }]);
      setNewProduct({ name: '', category: '', description: '', price: '', stock: '', image: '' });
    } catch (error) {
      console.error('Error al agregar producto:', error);
    }
  };

  const addPromotion = async () => {
    const { name, category, description, discount, image, price, stock, video } = newPromotion;
    const newPromotionData = {
      name, category, description,
      discount: parseInt(discount),
      image, price: parseFloat(price),
      stock: parseInt(stock), video
    };

    try {
      const promotionsRef = ref(db, 'products/promotions');
      const newPromotionRef = push(promotionsRef);
      await set(newPromotionRef, newPromotionData);
      setPromotions(prev => [...prev, { ...newPromotionData, id: newPromotionRef.key }]);
      setNewPromotion({ name: '', category: '', description: '', discount: '', image: '', price: '', stock: '', video: '' });
    } catch (error) {
      console.error('Error al agregar promoción:', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const productRef = ref(db, `products/products/${id}`);
      await set(productRef, null);
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  };

  const deletePromotion = async (id) => {
    try {
      const promoRef = ref(db, `products/promotions/${id}`);
      await set(promoRef, null);
      setPromotions(prev => prev.filter(promo => promo.id !== id));
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const updatedUserData = { ...userData, role: newRole };
        await set(userRef, updatedUserData);
        setUsers(prev => prev.map(user => user.id === userId ? { ...user, role: newRole } : user));
      }
    } catch (error) {
      console.error('Error al cambiar rol del usuario:', error);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handlePromotionInputChange = (e) => {
    const { name, value } = e.target;
    setNewPromotion(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Bienvenido, {username}</h2>
        <ul>
          <li className={visibleSection === 'productos' ? 'active' : ''} onClick={() => setVisibleSection('productos')}>Productos</li>
          <li className={visibleSection === 'promociones' ? 'active' : ''} onClick={() => setVisibleSection('promociones')}>Promociones</li>
          <li className={visibleSection === 'usuarios' ? 'active' : ''} onClick={() => setVisibleSection('usuarios')}>Usuarios</li>
        </ul>
        <button className="logout-button" onClick={logout}>Cerrar sesión</button>
      </aside>

      <main className="main-content">
        <div className="header">Panel de Administración</div>
        <div className="admin-section">
          {visibleSection === 'productos' && (
            <>
              <h2>Agregar Nuevo Producto</h2>
              <form onSubmit={(e) => { e.preventDefault(); addProduct(); }}>
                <input type="text" name="name" value={newProduct.name} onChange={handleProductInputChange} placeholder="Nombre" required />
                <select name="category" value={newProduct.category} onChange={handleProductInputChange} required>
                  <option value="">Seleccionar Categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <textarea name="description" value={newProduct.description} onChange={handleProductInputChange} placeholder="Descripción" required />
                <input type="number" name="price" value={newProduct.price} onChange={handleProductInputChange} placeholder="Precio" required />
                <input type="number" name="stock" value={newProduct.stock} onChange={handleProductInputChange} placeholder="Stock" required />
                <input type="url" name="image" value={newProduct.image} onChange={handleProductInputChange} placeholder="Imagen URL" required />
                <button type="submit">Agregar Producto</button>
              </form>

              <h2>Lista de Productos</h2>
              <ul>
                {products.map(product => (
                  <li key={product.id}>
                    {product.name} - S/.{product.price}
                 
                    <button 
                    className="eliminar" 
                    onClick={() => deleteProduct(product.id)}
                  >
                    Eliminar
                  </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {visibleSection === 'promociones' && (
            <>
              <h2>Agregar Nueva Promoción</h2>
              <form onSubmit={(e) => { e.preventDefault(); addPromotion(); }}>
                <input type="text" name="name" value={newPromotion.name} onChange={handlePromotionInputChange} placeholder="Nombre" required />
                <select name="category" value={newPromotion.category} onChange={handlePromotionInputChange} required>
                  <option value="">Seleccionar Categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <textarea name="description" value={newPromotion.description} onChange={handlePromotionInputChange} placeholder="Descripción" required />
                <input type="number" name="discount" value={newPromotion.discount} onChange={handlePromotionInputChange} placeholder="Descuento" required />
                <input type="url" name="image" value={newPromotion.image} onChange={handlePromotionInputChange} placeholder="Imagen URL" required />
                <input type="number" name="price" value={newPromotion.price} onChange={handlePromotionInputChange} placeholder="Precio" required />
                <input type="number" name="stock" value={newPromotion.stock} onChange={handlePromotionInputChange} placeholder="Stock" required />
                <input type="url" name="video" value={newPromotion.video} onChange={handlePromotionInputChange} placeholder="Video URL" />
                <button type="submit">Agregar Promoción</button>
              </form>

              <h2>Lista de Promociones</h2>
              <ul>
                {promotions.map(promotion => (
                  <li key={promotion.id}>
                    {promotion.name} - {promotion.discount}%
                    <button 
                    className="eliminar" 
                    onClick={() => deletePromotion(promotion.id)}
                  >
                    Eliminar
                  </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {visibleSection === 'usuarios' && (
            <>
              <h2>Lista de Usuarios</h2>
              <ul>
                {users.map(user => (
                  <li key={user.id}>
                    <div>
                      <strong>Nombre:</strong> {user.name}<br />
                      <strong>Apellido:</strong> {user.lastName}<br />
                      <strong>DNI:</strong> {user.dni}<br />
                      <strong>Email:</strong> {user.email}<br />
                      <strong>IP:</strong> {user.ip}<br />
                      <strong>Dispositivo:</strong> {user.device}<br />
                      <strong>Registrado:</strong> {user.registrationDate}<br />
                      <strong>Rol:</strong> {user.role}
                    </div>
                    <div>
                      <button onClick={() => changeUserRole(user.id, 'admin')}>Admin</button>
                      <button onClick={() => changeUserRole(user.id, 'cliente')}>Cliente</button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
