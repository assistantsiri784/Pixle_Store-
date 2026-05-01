let allProducts = [];
let cart = JSON.parse(localStorage.getItem('pixelCart') || '[]');
let currentUser = null;
let authModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  authModalInstance = new bootstrap.Modal(document.getElementById('authModal'));
  loadCategories();
  loadProducts();
  checkAuthStatus();
  updateCartUI();
});

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    if (data.logged_in) {
      currentUser = data;
      updateNavForUser(data);
    }
  } catch (e) {}
}

function updateNavForUser(user) {
  const authBtn = document.getElementById('authBtn');
  const adminBtn = document.getElementById('adminBtn');
  authBtn.querySelector('.nav-action-label').textContent = 'Hello,';
  authBtn.querySelector('.nav-action-main').textContent = user.name.split(' ')[0];
  if (user.is_admin) {
    adminBtn.classList.remove('d-none');
  }
}

async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const cats = await res.json();
    const nav = document.getElementById('categoryNav');
    const select = document.getElementById('searchCategory');
    nav.innerHTML = '';
    cats.forEach((cat, i) => {
      const btn = document.createElement('button');
      btn.className = `cat-pill${i === 0 ? ' active' : ''}`;
      btn.textContent = cat;
      btn.onclick = () => filterCategory(cat, btn);
      nav.appendChild(btn);
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  } catch (e) {}
}

async function loadProducts(category = 'All', search = '') {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<div class="text-center py-5 col-12"><div class="loading-spinner"></div><p class="mt-3 text-muted">Loading products...</p></div>';
  try {
    let url = '/api/products?';
    if (category && category !== 'All') url += `category=${encodeURIComponent(category)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (e) {
    grid.innerHTML = '<div class="text-center py-5 col-12 text-danger"><i class="fas fa-exclamation-triangle fa-3x mb-3"></i><p>Failed to load products. Make sure Flask server is running.</p></div>';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  document.getElementById('productCount').textContent = `${products.length} product${products.length !== 1 ? 's' : ''} found`;
  if (products.length === 0) {
    grid.innerHTML = '<div class="text-center py-5 col-12 text-muted"><i class="fas fa-search fa-3x mb-3" style="color:#ddd"></i><p>No products found.</p></div>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const discount = p.original_price && p.original_price > p.price
      ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    const stars = renderStars(p.rating);
    return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-2">
      <div class="product-card">
        <div class="product-img-wrap" onclick="quickView(${p.id})">
          ${discount ? `<span class="product-badge">-${discount}%</span>` : ''}
          <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'">
          <div class="product-actions-overlay">
            <button class="overlay-btn" title="Quick View" onclick="event.stopPropagation();quickView(${p.id})"><i class="fas fa-eye"></i></button>
            <button class="overlay-btn" title="Wishlist" onclick="event.stopPropagation();showToast('Added to wishlist!','info')"><i class="fas fa-heart"></i></button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-rating">
            <div class="stars">${stars}</div>
            <span class="rating-count">(${p.reviews.toLocaleString()})</span>
          </div>
          <div class="product-pricing">
            <span class="current-price">₹${p.price.toLocaleString('en-IN')}</span>
            ${p.original_price && p.original_price > p.price ? `<span class="original-price">₹${p.original_price.toLocaleString('en-IN')}</span><span class="discount-pct">${discount}% off</span>` : ''}
          </div>
          <button class="btn-add-cart" onclick="addToCart(${p.id})"><i class="fas fa-cart-plus me-2"></i>Add to Cart</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars += '<i class="fas fa-star"></i>';
    else if (i - rating < 1) stars += '<i class="fas fa-star-half-alt"></i>';
    else stars += '<i class="far fa-star"></i>';
  }
  return stars;
}

function filterCategory(cat, btn) {
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadProducts(cat);
}

function performSearch() {
  const search = document.getElementById('searchInput').value;
  const category = document.getElementById('searchCategory').value;
  loadProducts(category, search);
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') performSearch();
});

function sortProducts() {
  const val = document.getElementById('sortSelect').value;
  let sorted = [...allProducts];
  if (val === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (val === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  else if (val === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  renderProducts(sorted);
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name.substring(0, 30)}... added to cart!`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
  if (document.getElementById('view-cart').classList.contains('d-none') === false) {
    renderCartView();
  }
}

function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) {
    removeFromCart(productId);
    return;
  }
  saveCart();
  updateCartUI();
  renderCartView();
}

function saveCart() {
  localStorage.setItem('pixelCart', JSON.stringify(cart));
}

function updateCartUI() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = total;
}

function renderCartView() {
  const container = document.getElementById('cartItems');
  if (cart.length === 0) {
    container.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-cart"></i><h4>Your cart is empty</h4><p>Add some products to get started!</p></div>`;
    document.getElementById('cartSubtotal').textContent = '₹0';
    document.getElementById('cartTotal').textContent = '₹0';
    return;
  }
  container.innerHTML = cart.map(item => `
    <div class="cart-item-card">
      <img class="cart-item-img" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-cat">${item.category}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
          <button class="btn-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt me-1"></i>Remove</button>
        </div>
      </div>
      <div class="fw-bold">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
    </div>
  `).join('');
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('cartSubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('cartTotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
}

async function placeOrder() {
  if (!currentUser) {
    showToast('Please login to place an order', 'error');
    authModalInstance.show();
    return;
  }
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })) })
    });
    const data = await res.json();
    if (res.ok) {
      cart = [];
      saveCart();
      updateCartUI();
      showToast('Order placed successfully! 🎉', 'success');
      showView('home');
    } else {
      showToast(data.error || 'Order failed', 'error');
    }
  } catch (e) {
    showToast('Network error. Please try again.', 'error');
  }
}

function showView(view) {
  document.getElementById('view-home').classList.add('d-none');
  document.getElementById('view-cart').classList.add('d-none');
  document.getElementById('view-admin').classList.add('d-none');
  if (view === 'home') {
    document.getElementById('view-home').classList.remove('d-none');
  } else if (view === 'cart') {
    document.getElementById('view-cart').classList.remove('d-none');
    renderCartView();
  } else if (view === 'admin') {
    if (!currentUser || !currentUser.is_admin) {
      showToast('Admin access required', 'error');
      return;
    }
    document.getElementById('view-admin').classList.remove('d-none');
    loadAdminDashboard();
  }
  window.scrollTo(0, 0);
}

async function loadAdminDashboard() {
  try {
    const [pRes, oRes] = await Promise.all([fetch('/api/products'), fetch('/api/orders')]);
    const products = await pRes.json();
    const orders = await oRes.json();
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
    document.getElementById('adminStats').innerHTML = `
      <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon orange"><i class="fas fa-box"></i></div><div><div class="stat-val">${products.length}</div><div class="stat-lbl">Products</div></div></div></div>
      <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon blue"><i class="fas fa-receipt"></i></div><div><div class="stat-val">${orders.length}</div><div class="stat-lbl">Orders</div></div></div></div>
      <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon green"><i class="fas fa-rupee-sign"></i></div><div><div class="stat-val">₹${Math.round(totalRevenue/1000)}K</div><div class="stat-lbl">Revenue</div></div></div></div>
      <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon purple"><i class="fas fa-users"></i></div><div><div class="stat-val">${new Set(orders.map(o => o.user_email)).size}</div><div class="stat-lbl">Customers</div></div></div></div>
    `;
    document.getElementById('adminProductList').innerHTML = products.map(p => `
      <div class="admin-product-row">
        <img class="admin-product-img" src="${p.image_url}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-price">₹${p.price.toLocaleString('en-IN')}</div>
        <button class="btn-delete" onclick="adminDeleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
    const orderRows = orders.slice(0, 10).map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${o.product_name.substring(0, 25)}...</td>
        <td>${o.user_email}</td>
        <td>×${o.quantity}</td>
        <td>₹${o.total_price.toLocaleString('en-IN')}</td>
        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      </tr>
    `).join('');
    document.getElementById('adminOrderList').innerHTML = `
      <div style="overflow-x:auto">
        <table class="order-table">
          <thead><tr><th>#</th><th>Product</th><th>Customer</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>${orderRows || '<tr><td colspan="6" class="text-center text-muted py-3">No orders yet</td></tr>'}</tbody>
        </table>
      </div>`;
  } catch (e) {
    showToast('Failed to load dashboard data', 'error');
  }
}

async function adminAddProduct() {
  const name = document.getElementById('pName').value.trim();
  const desc = document.getElementById('pDesc').value.trim();
  const price = document.getElementById('pPrice').value;
  const origPrice = document.getElementById('pOrigPrice').value;
  const imageUrl = document.getElementById('pImageUrl').value.trim();
  const category = document.getElementById('pCategory').value.trim();
  const stock = document.getElementById('pStock').value;
  if (!name || !desc || !price || !imageUrl || !category) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, price, original_price: origPrice || price, image_url: imageUrl, category, stock })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Product added successfully!', 'success');
      ['pName','pDesc','pPrice','pOrigPrice','pImageUrl','pCategory'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('pStock').value = '10';
      loadAdminDashboard();
      loadProducts();
    } else {
      showToast(data.error || 'Failed to add product', 'error');
    }
  } catch (e) {
    showToast('Network error', 'error');
  }
}

async function adminDeleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Product deleted', 'success');
      loadAdminDashboard();
      loadProducts();
    }
  } catch (e) {
    showToast('Delete failed', 'error');
  }
}

function quickView(productId) {
  const p = allProducts.find(prod => prod.id === productId);
  if (!p) return;
  addToCart(productId);
}

function toggleAuthModal() {
  if (currentUser) {
    authModalInstance.show();
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('signupForm').classList.add('d-none');
    document.getElementById('logoutSection').classList.remove('d-none');
    document.getElementById('loginTab').parentElement.style.display = 'none';
  } else {
    document.getElementById('loginForm').classList.remove('d-none');
    document.getElementById('signupForm').classList.add('d-none');
    document.getElementById('logoutSection').classList.add('d-none');
    const tabWrapper = document.querySelector('.auth-tabs');
    if (tabWrapper) tabWrapper.style.display = '';
    authModalInstance.show();
  }
}

function switchTab(tab) {
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
  document.getElementById('loginForm').classList.toggle('d-none', tab !== 'login');
  document.getElementById('signupForm').classList.toggle('d-none', tab !== 'signup');
  document.getElementById('authError').classList.add('d-none');
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showAuthError('Please fill all fields'); return; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = { name: data.name, is_admin: data.is_admin };
      updateNavForUser(currentUser);
      authModalInstance.hide();
      showToast(`Welcome back, ${data.name}! 👋`, 'success');
    } else {
      showAuthError(data.error);
    }
  } catch (e) {
    showAuthError('Network error. Try again.');
  }
}

async function doSignup() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  if (!name || !email || !password) { showAuthError('Please fill all fields'); return; }
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = { name: data.name, is_admin: data.is_admin };
      updateNavForUser(currentUser);
      authModalInstance.hide();
      showToast(`Welcome to Pixel Store, ${data.name}! 🎉`, 'success');
    } else {
      showAuthError(data.error);
    }
  } catch (e) {
    showAuthError('Network error. Try again.');
  }
}

async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  const authBtn = document.getElementById('authBtn');
  authBtn.querySelector('.nav-action-label').textContent = 'Hello, Guest';
  authBtn.querySelector('.nav-action-main').textContent = 'Account';
  document.getElementById('adminBtn').classList.add('d-none');
  authModalInstance.hide();
  showView('home');
  showToast('Logged out successfully', 'info');
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.remove('d-none');
}

function scrollToProducts() {
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `<i class="${icons[type]}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
