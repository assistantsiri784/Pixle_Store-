from flask import Flask, request, jsonify, render_template, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pixelstore.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    original_price = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    stock = db.Column(db.Integer, default=10)
    rating = db.Column(db.Float, default=4.0)
    reviews = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def seed_products():
    if Product.query.count() == 0:
        products = [
            Product(name="Sony WH-1000XM5 Headphones", description="Industry-leading noise canceling with Auto NC Optimizer", price=24999, original_price=34990, image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", category="Electronics", stock=15, rating=4.8, reviews=2341),
            Product(name="Apple MacBook Air M2", description="Supercharged by the next-generation M2 chip", price=114900, original_price=129900, image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", category="Computers", stock=8, rating=4.9, reviews=5672),
            Product(name="Nike Air Max 270", description="Lightweight, breathable design with Air unit heel", price=8995, original_price=12995, image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", category="Footwear", stock=30, rating=4.5, reviews=1823),
            Product(name="Samsung 4K QLED TV 55\"", description="Quantum HDR with 100% Color Volume display", price=59999, original_price=89999, image_url="https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400", category="Electronics", stock=5, rating=4.7, reviews=987),
            Product(name="Instant Pot Duo 7-in-1", description="Pressure cooker, slow cooker, rice cooker and more", price=6999, original_price=9999, image_url="https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", category="Kitchen", stock=20, rating=4.6, reviews=4521),
            Product(name="Levi's 511 Slim Jeans", description="Classic slim fit with just the right stretch", price=2999, original_price=4499, image_url="https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", category="Clothing", stock=45, rating=4.4, reviews=3201),
            Product(name="Kindle Paperwhite", description="Now with a larger 6.8\" display and adjustable warm light", price=13999, original_price=16999, image_url="https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400", category="Electronics", stock=12, rating=4.7, reviews=8901),
            Product(name="Dyson V12 Detect Slim", description="Laser technology reveals microscopic dust", price=49900, original_price=62900, image_url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", category="Home", stock=7, rating=4.6, reviews=1234),
            Product(name="Canon EOS R50 Camera", description="24.2MP APS-C sensor mirrorless camera", price=64995, original_price=75995, image_url="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400", category="Electronics", stock=6, rating=4.8, reviews=765),
            Product(name="LEGO Technic Bugatti", description="42151 piece set inspired by the Bugatti Bolide", price=4999, original_price=6999, image_url="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400", category="Toys", stock=18, rating=4.9, reviews=2100),
            Product(name="Philips Air Fryer XXL", description="7L capacity with Rapid Air technology", price=12995, original_price=17995, image_url="https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400", category="Kitchen", stock=22, rating=4.5, reviews=3456),
            Product(name="Boat Rockerz 450 Headphones", description="40 hours of playback with super bass", price=1299, original_price=2990, image_url="https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400", category="Electronics", stock=50, rating=4.2, reviews=9871),
        ]
        for p in products:
            db.session.add(p)
        db.session.commit()

with app.app_context():
    db.create_all()
    seed_products()
    if not User.query.filter_by(email='admin@pixelstore.com').first():
        admin = User(name='Admin', email='admin@pixelstore.com', password=generate_password_hash('admin123'), is_admin=True)
        db.session.add(admin)
        db.session.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search')
    query = Product.query
    if category and category != 'All':
        query = query.filter_by(category=category)
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    products = query.all()
    return jsonify([{
        'id': p.id, 'name': p.name, 'description': p.description,
        'price': p.price, 'original_price': p.original_price,
        'image_url': p.image_url, 'category': p.category,
        'stock': p.stock, 'rating': p.rating, 'reviews': p.reviews
    } for p in products])

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    p = Product.query.get_or_404(product_id)
    return jsonify({'id': p.id, 'name': p.name, 'description': p.description, 'price': p.price, 'original_price': p.original_price, 'image_url': p.image_url, 'category': p.category, 'stock': p.stock, 'rating': p.rating, 'reviews': p.reviews})

@app.route('/api/products', methods=['POST'])
def add_product():
    if not session.get('user_id') or not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    product = Product(
        name=data['name'], description=data['description'],
        price=float(data['price']), original_price=float(data.get('original_price', data['price'])),
        image_url=data['image_url'], category=data['category'],
        stock=int(data.get('stock', 10)), rating=float(data.get('rating', 4.0)), reviews=0
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({'message': 'Product added', 'id': product.id}), 201

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not session.get('user_id') or not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted'})

@app.route('/api/orders', methods=['POST'])
def create_order():
    if not session.get('user_id'):
        return jsonify({'error': 'Please login to place order'}), 401
    data = request.json
    items = data.get('items', [])
    order_ids = []
    for item in items:
        product = Product.query.get(item['product_id'])
        if not product:
            continue
        order = Order(
            user_id=session['user_id'], product_id=item['product_id'],
            quantity=item['quantity'], total_price=product.price * item['quantity']
        )
        db.session.add(order)
        order_ids.append(order.id)
    db.session.commit()
    return jsonify({'message': 'Order placed successfully', 'order_ids': order_ids}), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    if not session.get('user_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    if session.get('is_admin'):
        orders = Order.query.all()
    else:
        orders = Order.query.filter_by(user_id=session['user_id']).all()
    result = []
    for o in orders:
        p = Product.query.get(o.product_id)
        u = User.query.get(o.user_id)
        result.append({'id': o.id, 'product_name': p.name if p else 'N/A', 'user_email': u.email if u else 'N/A', 'quantity': o.quantity, 'total_price': o.total_price, 'status': o.status, 'created_at': o.created_at.strftime('%Y-%m-%d %H:%M')})
    return jsonify(result)

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    user = User(name=data['name'], email=data['email'], password=generate_password_hash(data['password']))
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    session['user_name'] = user.name
    session['is_admin'] = user.is_admin
    return jsonify({'message': 'Account created', 'name': user.name, 'is_admin': user.is_admin}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    session['user_id'] = user.id
    session['user_name'] = user.name
    session['is_admin'] = user.is_admin
    return jsonify({'message': 'Login successful', 'name': user.name, 'is_admin': user.is_admin})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    if session.get('user_id'):
        return jsonify({'logged_in': True, 'name': session.get('user_name'), 'is_admin': session.get('is_admin', False)})
    return jsonify({'logged_in': False})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    cats = db.session.query(Product.category).distinct().all()
    return jsonify(['All'] + [c[0] for c in cats])

if __name__ == '__main__':
    app.run(debug=True)
