# Farmers' Direct Market - MERN Project

A modern marketplace that connects small and medium farmers directly with restaurants, retailers and individual buyers — removing middlemen, improving farmers' margins, and giving buyers fresher produce at fairer prices.

## 🚀 Features

### MVP Features (Implemented)
- ✅ User authentication and role-based access (Farmer/Buyer)
- ✅ Farmer product listing and management
- ✅ Geo-based product search with filters
- ✅ Shopping cart functionality
- ✅ Order management and tracking
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Real-time search and filtering

### Phase 2 Features (Planned)
- 🔄 Real-time chat between farmers and buyers
- 🔄 Payment integration (Stripe/PayPal)
- 🔄 Image upload with Cloudinary
- 🔄 Push notifications
- 🔄 Rating and review system
- 🔄 Admin dashboard
- 🔄 Mobile app

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Deployment**: Vercel (Frontend) + Render/Heroku (Backend)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (for production)
- Cloudinary account (for image uploads)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd farmerdm
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
The project includes a `.env.local` file with development defaults. For production, update these values:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run the development server
```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000) (or the next available port).

## ✅ Current Status

**WORKING FEATURES:**
- ✅ **CSS/Styling**: Tailwind CSS is fully functional
- ✅ **Authentication**: Login/Register pages with validation
- ✅ **Responsive Design**: Mobile-friendly layout
- ✅ **Internationalization**: Multi-language support (English/Spanish)
- ✅ **Database Integration**: MongoDB with Mongoose
- ✅ **API Routes**: RESTful API endpoints
- ✅ **Development Environment**: Hot reload and fast refresh

**SIMPLIFIED ARCHITECTURE:**
- Removed complex custom server setup
- Removed Socket.io dependencies (can be re-added later)
- Removed unused security middleware
- Streamlined for easier development and deployment

## 📁 Project Structure

```
farmerdm/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   └── products/           # Product management
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── farmer/                 # Farmer dashboard
│   │   │   └── dashboard/
│   │   ├── buyer/                  # Buyer dashboard
│   │   │   └── dashboard/
│   │   ├── globals.css             # Global styles
│   │   ├── layout.js               # Root layout
│   │   └── page.js                 # Homepage
│   └── components/                 # Reusable components
├── public/                         # Static assets
├── package.json
└── README.md
```

## 🎯 User Roles & Features

### 👨‍🌾 Farmer
- **Dashboard**: View products, orders, and analytics
- **Product Management**: Add, edit, and delete products
- **Order Management**: View and update order status
- **Analytics**: Track sales, ratings, and performance

### 🏪 Buyer (Restaurant/Retailer/Individual)
- **Product Discovery**: Search and filter products by location, category, price
- **Shopping Cart**: Add products and manage quantities
- **Order Tracking**: View order history and status
- **Farmer Profiles**: View farmer ratings and reviews

### 👨‍💼 Admin (Future)
- **User Verification**: Verify farmer accounts
- **Dispute Resolution**: Handle conflicts between users
- **Analytics**: Platform-wide statistics and insights

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products with filters
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders (Future)
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/[id]` - Update order status

## 🎨 UI Components

The application uses a custom design system with Tailwind CSS:

- **Cards**: `.card` - Consistent card styling
- **Buttons**: `.btn-primary`, `.btn-secondary` - Button variants
- **Inputs**: `.input-field` - Form input styling
- **Colors**: Green theme for agriculture/farming

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Heroku)
1. Create a new web service
2. Connect your repository
3. Set environment variables
4. Deploy

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting (planned)

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@farmdirect.com or create an issue in the repository.

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] User authentication
- [x] Product listing
- [x] Basic search and filtering
- [x] Shopping cart
- [x] Order management

### Phase 2 (Next) 🔄
- [ ] Real-time chat
- [ ] Payment integration
- [ ] Image upload
- [ ] Push notifications
- [ ] Rating system

### Phase 3 (Future) 📋
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] Advanced delivery tracking

---

**Built with ❤️ for farmers and buyers**
