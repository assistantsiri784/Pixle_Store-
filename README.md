:

🛍️ Pixel Store — Full Stack E-commerce Web App

Pixel Store is a modern full-stack e-commerce web application built using Flask (Python) for the backend and HTML, CSS, JavaScript for the frontend. It provides a seamless shopping experience with features like product browsing, cart management, authentication, and an admin dashboard.

🚀 Features
👤 User Features
User Signup & Login (Session-based authentication)
Browse products by category
Search & filter products
Add/remove items from cart
Place orders
View order history
🛒 Shopping Experience
Dynamic product listing
Discount calculation & ratings display
Responsive UI with modern design
Local storage-based cart system
🧑‍💼 Admin Features
Admin login access
Add new products
Delete products
View all orders
Dashboard with stats (products, revenue, users)
🏗️ Tech Stack
Backend
Python
Flask
Flask-SQLAlchemy (Database ORM)
SQLite (Database)
Frontend
HTML
CSS
JavaScript
Bootstrap 5
Font Awesome
📁 Project Structure
PixelStore/
│── app.py              # Flask backend (API + database models)
│── templates/
│   └── index.html      # Main UI page
│── static/
│   ├── style.css       # Styling
│   └── script.js       # Frontend logic
│── pixelstore.db       # SQLite database (auto-created)
⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/your-username/pixel-store.git
cd pixel-store
2️⃣ Create Virtual Environment (Recommended)
python -m venv venv
source venv/bin/activate   # For Linux/Mac
venv\Scripts\activate      # For Windows
3️⃣ Install Dependencies
pip install flask flask_sqlalchemy werkzeug
4️⃣ Run the Application
python app.py
5️⃣ Open in Browser
http://127.0.0.1:5000/
🔐 Default Admin Credentials
Email: admin@pixelstore.com
Password: admin123
📦 API Endpoints
🔹 Products
GET /api/products → Get all products
GET /api/products/<id> → Get product details
POST /api/products → Add product (Admin)
DELETE /api/products/<id> → Delete product (Admin)
🔹 Orders
POST /api/orders → Place order
GET /api/orders → Get orders
🔹 Authentication
POST /api/auth/signup → Register user
POST /api/auth/login → Login user
💡 Key Highlights
Clean UI inspired by modern e-commerce platforms
Fully functional backend with REST APIs
Session-based authentication system
Admin dashboard with real-time stats
Pre-seeded products for quick testing
📸 Screens (Optional - Add Images)
Home Page
Product Listing
Cart Page
Admin Dashboard
🛠️ Future Improvements
Payment gateway integration (Razorpay/Stripe)
Wishlist functionality
Product reviews system
Order tracking system
JWT authentication
🤝 Contributing

Contributions are welcome!
Feel free to fork this repo and submit a pull request.

📄 License

This project is open-source and available under the MIT License.
