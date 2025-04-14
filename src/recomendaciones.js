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