import React, { useState, useEffect } from "react";
import { db, ref, get  } from '../firebase_database/firebase';
import '../styles/Ventaspage.scss';
import CarritoModal from './CarritoModal';
import { useNavigate } from "react-router-dom";






const VentasPage = () => {
  const [userName, setUserName] = useState("Cliente");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [productos, setProductos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  const [precioFiltro, setPrecioFiltro] = useState(0);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const [comprasUsuario, setComprasUsuario] = useState([]);
  const navigate = useNavigate();


  const [precioFiltroAplicado, setPrecioFiltroAplicado] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.name) {
      setUserName(user.name);
    } else {
      console.log("El nombre del usuario no está disponible.");
    }

    const fetchProductos = async () => {
      const productosRef = ref(db, 'products/products');
      const snapshot = await get(productosRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productosArray = Object.values(data);
        setProductos(productosArray);
      } else {
        console.log("No hay productos disponibles.");
      }
    };

    const fetchPromociones = async () => {
      const promocionesRef = ref(db, 'products/promotions');
      const snapshot = await get(promocionesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const promocionesArray = Object.values(data);
        setPromociones(promocionesArray);
      } else {
        console.log("No hay promociones disponibles.");
      }
    };
    const fetchComprasUsuario = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.email) return;
    
      const comprasRef = ref(db, 'comprasRealizadas');
      const snapshot = await get(comprasRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
    
        // Filtra las compras por email del usuario
        const compras = Object.values(data).filter(c => c.usuario?.email === user.email);
    
        // Extrae todos los productos comprados
        const productosComprados = compras.flatMap(c => c.productos || []);
    
        console.log("Compras encontradas:", compras);
        console.log("Productos comprados por usuario:", productosComprados);
    
        setComprasUsuario(productosComprados);
      }
    };
    fetchProductos();
    fetchPromociones();
    fetchComprasUsuario();
  }, []);









   // ALGORITMO DE LA IA - - - - -

  useEffect(() => {
    if (productos.length === 0 || comprasUsuario.length === 0) return;
  
    // Productos que el usuario ya compró, comparando por name
    const historialUsuario = productos.filter(p =>
      comprasUsuario.some(c => c.name === p.name)
    );
  
    const historialText = historialUsuario
      .map(p => `${p.name} ${p.description}`)
      .join(" ");
  
    const tokenize = text =>
      text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  
    const buildTf = doc => {
      const tokens = tokenize(doc);
      const tf = {};
      tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
      });
      const total = tokens.length;
      Object.keys(tf).forEach(k => (tf[k] /= total));
      return tf;
    };
  
    const buildIdf = docs => {
      const idf = {};
      const N = docs.length;
      docs.forEach(doc => {
        const tokens = new Set(tokenize(doc));
        tokens.forEach(token => {
          idf[token] = (idf[token] || 0) + 1;
        });
      });
      Object.keys(idf).forEach(k => (idf[k] = Math.log(N / idf[k])));
      return idf;
    };
  
    const buildTfIdfVector = (tf, idf) => {
      const vector = {};
      Object.keys(tf).forEach(token => {
        vector[token] = tf[token] * (idf[token] || 0);
      });
      return vector;
    };
  
    const cosineSimilarity = (vec1, vec2) => {
      const intersection = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
      let dot = 0,
        mag1 = 0,
        mag2 = 0;
      intersection.forEach(token => {
        const v1 = vec1[token] || 0;
        const v2 = vec2[token] || 0;
        dot += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
      });
      return mag1 && mag2 ? dot / (Math.sqrt(mag1) * Math.sqrt(mag2)) : 0;
    };
  
    const documentos = productos.map(p => `${p.name} ${p.description}`);
    const idf = buildIdf(documentos);
    const tfHistorial = buildTf(historialText);
    const vecHistorial = buildTfIdfVector(tfHistorial, idf);
  
    const similitudes = productos.map(producto => {
      const tf = buildTf(`${producto.name} ${producto.description}`);
      const vec = buildTfIdfVector(tf, idf);
      const sim = cosineSimilarity(vecHistorial, vec);
      return { producto, sim };
    });
  
    const recomendacionesOrdenadas = similitudes
      .sort((a, b) => b.sim - a.sim)
      .filter(item =>
        item.sim > 0 &&
        !comprasUsuario.some(c => c.name === item.producto.name)
      )
      .slice(0, 5)
      .map(item => item.producto);
  
    setRecomendaciones(recomendacionesOrdenadas);
  }, [productos, comprasUsuario]);

   // FIN ALGORITMO DE LA IA - - - - -




  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  const handleMoreInfo = (productoId) => {
    console.log("Ver más detalles del producto", productoId);
  };

  const handleBuy = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const toggleCarritoModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleLogout = () => {
    setShowLogoutMessage(true);
    localStorage.removeItem("user");
    setTimeout(() => {
      navigate("/");
      setShowLogoutMessage(false);
    }, 2000);
  };

  const productosFiltrados = productos.filter(producto => {
  return (categoriaFiltro === "Todos" || producto.category === categoriaFiltro) &&
         (precioFiltroAplicado === 0 || producto.price <= precioFiltroAplicado);
});


const aplicarFiltro = () => {
  setPrecioFiltroAplicado(precioFiltro); // Aplicamos el filtro solo cuando se presiona el botón
};


  const categoriasUnicas = ["Todos", ...new Set(productos.map(p => p.category))];

  return (
   
    
    
    <div className="ventas-page">
      
      
      <nav className="navbar">
        <div className="navbar-logo">

     
          <h1>TECNOLOGY VIEW PERU</h1>
        </div>
        <div className="navbar-links">
          <a href="#productos">Productos</a>
          <a href="#recomendados">Recomendados</a>
          <a href="#promociones">Promociones</a>
        </div>
        
        <div className="navbar-user">
          <span className="welcome-message">Bienvenido, {userName}</span>
          <div className="user-icon" onClick={toggleAccountMenu}>
            <img src="https://img.icons8.com/ios-filled/50/000000/user.png" alt="user icon" />
          </div>
          {showAccountMenu && (
            <div className="account-menu">
              <ul>
                <li><a href="#mi-cuenta">Ver Mis Datos</a></li>
                <li><a href="#cerrar-sesion" onClick={handleLogout}>Cerrar Sesión</a></li>
              </ul>
            </div>
          )}
        </div>
        <div className="cart-icon" onClick={toggleCarritoModal}>
          <img src="https://img.icons8.com/ios-filled/50/000000/shopping-cart.png" alt="cart icon" />
          <span>{carrito.length}</span>
        </div>
      </nav>

      {showLogoutMessage && (
        <div className="logout-message">
          <p>Cerrando sesión, espere por favor...</p>
        </div>
      )}

       


      <div className="main-wrapper">
        <aside className="filters">
          <h3>Filtrar</h3>
          <div className="filter-group">
            <label>Precio máximo: S/. {precioFiltro}</label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={precioFiltro}
              onChange={(e) => setPrecioFiltro(Number(e.target.value))}
            />




             

            <button onClick={aplicarFiltro} class="button">
            Aplicar Filtro
                <svg fill="currentColor" viewBox="0 0 24 24" class="icon">
                  <path
                    clip-rule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                    fill-rule="evenodd"
                  ></path>
                </svg>
              </button>






          </div>

          <div className="filter-group">
            <label>Categoría:</label>
            <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
              {categoriasUnicas.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </aside>

        <main className="main-content">
        
      
<section className="section" id="productos">
  
        

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
      <span class="loader-text">NUESTROS PRODUCTOS </span>
      <span id="dot1" class="dot">.</span>
      <span id="dot2" class="dot">.</span>
      <span id="dot3" class="dot">.</span>
    </div>
  </div>
</div>


  <div className="product-grid">
    {productosFiltrados.map((producto, index) => (
      <div key={index} className="card">
        <div className="content">
          <div className="front">
            <div className="img">
              <img src={producto.image} alt={producto.name} className="product-image" />
            </div>
            <div className="front-content">
              <p className="price">S/. {producto.price}</p>
              <p className="title"><strong>{producto.name}</strong></p>
              
            </div>
          </div>

          <div className="back">
            <div className="back-content">
              <p className="title"><strong>{producto.name}</strong></p>
              <p className="card-footer">{producto.description}</p>
              <div className="product-buttons">
              <button class="Btn">
                  Mas Información
                  <svg class="svgIcon" viewBox="0 0 576 512"><path d="M512 80c8.8 0 16 7.2 16 16v32H48V96c0-8.8 7.2-16 16-16H512zm16 144V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224H528zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm56 304c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24H360c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"></path></svg>
                </button>
             
              <button class="button"onClick={() => handleBuy(producto)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0.296997C5.37 0.296997 0 5.67 0 12.297C0 17.6 3.438 22.097 8.205 23.682C8.805 23.795 9.025 23.424 9.025 23.105C9.025 22.82 9.015 22.065 9.01 21.065C5.672 21.789 4.968 19.455 4.968 19.455C4.422 18.07 3.633 17.7 3.633 17.7C2.546 16.956 3.717 16.971 3.717 16.971C4.922 17.055 5.555 18.207 5.555 18.207C6.625 20.042 8.364 19.512 9.05 19.205C9.158 18.429 9.467 17.9 9.81 17.6C7.145 17.3 4.344 16.268 4.344 11.67C4.344 10.36 4.809 9.29 5.579 8.45C5.444 8.147 5.039 6.927 5.684 5.274C5.684 5.274 6.689 4.952 8.984 6.504C9.944 6.237 10.964 6.105 11.984 6.099C13.004 6.105 14.024 6.237 14.984 6.504C17.264 4.952 18.269 5.274 18.269 5.274C18.914 6.927 18.509 8.147 18.389 8.45C19.154 9.29 19.619 10.36 19.619 11.67C19.619 16.28 16.814 17.295 14.144 17.59C14.564 17.95 14.954 18.686 14.954 19.81C14.954 21.416 14.939 22.706 14.939 23.096C14.939 23.411 15.149 23.786 15.764 23.666C20.565 22.092 24 17.592 24 12.297C24 5.67 18.627 0.296997 12 0.296997Z" fill="white"></path>
                </svg>
                <span className="texts">Añadir al carrito</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>


<section className="section" id="recomendados">
  

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
      <span class="loader-text">PRODUCTOS RECOMENDADOS </span>
      <span id="dot1" class="dot">.</span>
      <span id="dot2" class="dot">.</span>
      <span id="dot3" class="dot">.</span>
    </div>
  </div>
</div>


  <div className="product-grid">
    {recomendaciones.length > 0 ? (
      recomendaciones.map((producto, index) => (
        <div key={index} className="card">
          <div className="content">
            <div className="front">
              <div className="img">
                <img src={producto.image} alt={producto.name} className="product-image" />
              </div>
              <div className="front-content">
                <p className="price">S/. {producto.price}</p>
                <p className="title"><strong>{producto.name}</strong></p>
             
              </div>
            </div>
            <div className="back">
              <div className="back-content">
                <p className="title"><strong>{producto.name}</strong></p>
                <p className="card-footer">{producto.description}</p>
                <div className="product-buttons">
                <button class="Btn">
                  Mas Información
                  <svg class="svgIcon" viewBox="0 0 576 512"><path d="M512 80c8.8 0 16 7.2 16 16v32H48V96c0-8.8 7.2-16 16-16H512zm16 144V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224H528zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm56 304c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24H360c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"></path></svg>
                </button>
             
              <button class="button"onClick={() => handleBuy(producto)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0.296997C5.37 0.296997 0 5.67 0 12.297C0 17.6 3.438 22.097 8.205 23.682C8.805 23.795 9.025 23.424 9.025 23.105C9.025 22.82 9.015 22.065 9.01 21.065C5.672 21.789 4.968 19.455 4.968 19.455C4.422 18.07 3.633 17.7 3.633 17.7C2.546 16.956 3.717 16.971 3.717 16.971C4.922 17.055 5.555 18.207 5.555 18.207C6.625 20.042 8.364 19.512 9.05 19.205C9.158 18.429 9.467 17.9 9.81 17.6C7.145 17.3 4.344 16.268 4.344 11.67C4.344 10.36 4.809 9.29 5.579 8.45C5.444 8.147 5.039 6.927 5.684 5.274C5.684 5.274 6.689 4.952 8.984 6.504C9.944 6.237 10.964 6.105 11.984 6.099C13.004 6.105 14.024 6.237 14.984 6.504C17.264 4.952 18.269 5.274 18.269 5.274C18.914 6.927 18.509 8.147 18.389 8.45C19.154 9.29 19.619 10.36 19.619 11.67C19.619 16.28 16.814 17.295 14.144 17.59C14.564 17.95 14.954 18.686 14.954 19.81C14.954 21.416 14.939 22.706 14.939 23.096C14.939 23.411 15.149 23.786 15.764 23.666C20.565 22.092 24 17.592 24 12.297C24 5.67 18.627 0.296997 12 0.296997Z" fill="white"></path>
                </svg>
                <span className="texts">Añadir al carrito</span>
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p>No hay productos recomendados disponibles.</p>
    )}
  </div>
</section>


<section className="section" id="promociones">
  
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
      <span class="loader-text">PROMOCIONES </span>
      <span id="dot1" class="dot">.</span>
      <span id="dot2" class="dot">.</span>
      <span id="dot3" class="dot">.</span>
    </div>
  </div>
</div>

  <div className="product-grid">
    {promociones.length > 0 ? (
      promociones.map((promocion, index) => (
        <div key={index} className="card">
          <div className="content">
            <div className="front">
              <div className="img">
                <img src={promocion.image} alt={promocion.name} className="product-image" />
              </div>
              <div className="front-content">
                <p className="price">
                  <strong>{promocion.discount}% OFF</strong> - S/. {promocion.price}
                </p>
                <p className="title"><strong>{promocion.name}</strong></p>
               
              </div>
            </div>
            <div className="back">
              <div className="back-content">
                <p className="title"><strong>{promocion.name}</strong></p>
                <p className="card-footer">{promocion.description}</p>
                <div className="product-buttons">
                <button class="Btn" onClick={() => handleMoreInfo(promocion.id)}>
                  Mas Información
                  <svg class="svgIcon" viewBox="0 0 576 512"><path d="M512 80c8.8 0 16 7.2 16 16v32H48V96c0-8.8 7.2-16 16-16H512zm16 144V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224H528zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm56 304c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24H360c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"></path></svg>
                </button>
                
              <button class="button" onClick={() => handleBuy(promocion)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0.296997C5.37 0.296997 0 5.67 0 12.297C0 17.6 3.438 22.097 8.205 23.682C8.805 23.795 9.025 23.424 9.025 23.105C9.025 22.82 9.015 22.065 9.01 21.065C5.672 21.789 4.968 19.455 4.968 19.455C4.422 18.07 3.633 17.7 3.633 17.7C2.546 16.956 3.717 16.971 3.717 16.971C4.922 17.055 5.555 18.207 5.555 18.207C6.625 20.042 8.364 19.512 9.05 19.205C9.158 18.429 9.467 17.9 9.81 17.6C7.145 17.3 4.344 16.268 4.344 11.67C4.344 10.36 4.809 9.29 5.579 8.45C5.444 8.147 5.039 6.927 5.684 5.274C5.684 5.274 6.689 4.952 8.984 6.504C9.944 6.237 10.964 6.105 11.984 6.099C13.004 6.105 14.024 6.237 14.984 6.504C17.264 4.952 18.269 5.274 18.269 5.274C18.914 6.927 18.509 8.147 18.389 8.45C19.154 9.29 19.619 10.36 19.619 11.67C19.619 16.28 16.814 17.295 14.144 17.59C14.564 17.95 14.954 18.686 14.954 19.81C14.954 21.416 14.939 22.706 14.939 23.096C14.939 23.411 15.149 23.786 15.764 23.666C20.565 22.092 24 17.592 24 12.297C24 5.67 18.627 0.296997 12 0.296997Z" fill="white"></path>
                </svg>
                <span className="texts">Añadir al carrito</span>
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p>No hay promociones disponibles.</p>
    )}
  </div>

  
</section>

        </main>
      </div>

      <CarritoModal isOpen={isModalOpen} closeModal={toggleCarritoModal} carrito={carrito} />
      </div>
    
  );
};


export default VentasPage;
