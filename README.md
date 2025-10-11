# 🎓 EduLink - Educational Funding Platform

**Connecting rural and underfunded schools with donors and NGOs for verified student scholarships and infrastructure support through a transparent, UDISE-verified platform.**

## ✨ Features

### 🔐 **Authentication System**
- ✅ **User Registration & Login** - Secure authentication with Supabase
- ✅ **Role-based Access** - School Admin, Donor, and Admin roles
- ✅ **Protected Routes** - Role-specific dashboard access
- ✅ **Session Management** - Persistent login across browser sessions

### 🏫 **School Management**
- ✅ **UDISE ID Verification** - Schools register with official UDISE IDs
- ✅ **School Profiles** - Complete school information and verification status
- ✅ **Funding Requests** - Create scholarship and infrastructure requests
- ✅ **Request Tracking** - Monitor request status and progress

### 💝 **Donor Features**
- ✅ **Browse Requests** - View verified funding requests
- ✅ **Express Interest** - Show interest in supporting specific requests
- ✅ **Impact Tracking** - Monitor your contributions and impact
- ✅ **Filter & Search** - Find requests by type, region, and amount

### 👨‍💼 **Admin Dashboard**
- ✅ **School Verification** - Verify schools and their UDISE IDs
- ✅ **Request Management** - Approve and manage funding requests
- ✅ **Platform Analytics** - Overview of schools, requests, and impact
- ✅ **User Management** - Monitor platform usage and activity

## 🚀 **Current Status**

### ✅ **Working Features**
- **Authentication System** - Registration, login, logout fully functional
- **User Interface** - Clean, responsive design with Tailwind CSS
- **Role-based Routing** - Proper dashboard access based on user roles
- **Database Integration** - Supabase backend with PostgreSQL
- **Error Handling** - Graceful fallbacks and user-friendly error messages

### 🔧 **Database Setup Required**
The platform works in "auth-only" mode by default. To enable full features:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `pdpblpontpaamkbcryeg`
3. **Open SQL Editor**
4. **Run the schema**: Copy/paste `database-schema-clean.sql`
5. **Verify setup**: Database Status should show "READY" ✅

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** - Modern React with hooks and functional components
- **React Router** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Context API** - State management for authentication

### **Backend**
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostgreSQL** - Relational database with Row Level Security
- **Supabase Auth** - Authentication and user management
- **Real-time subscriptions** - Live updates for requests and interests

### **Database Schema**
- **Users** - User profiles with roles and metadata
- **Schools** - UDISE-verified school information
- **Requests** - Funding requests with status tracking
- **Interests** - Donor interest in specific requests
- **Updates** - Progress updates on funded requests

## 📁 **Project Structure**

```
edubridge/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Common components (Navbar, Footer, etc.)
│   │   │   └── ...
│   │   ├── pages/              # Page components
│   │   │   ├── Home.js         # Landing page
│   │   │   ├── Register.js     # User registration
│   │   │   ├── Login.js        # User login
│   │   │   ├── SchoolDashboard.js    # School admin dashboard
│   │   │   ├── DonorDashboard.js     # Donor dashboard
│   │   │   └── AdminDashboard.js     # Platform admin dashboard
│   │   ├── context/            # React Context providers
│   │   │   └── AuthContext.js  # Authentication state management
│   │   ├── lib/                # Utility libraries
│   │   │   └── supabase.js     # Supabase client configuration
│   │   └── services/           # API services
│   └── public/                 # Static assets
├── server/                     # Node.js backend (optional)
├── database-schema-clean.sql   # Database setup script
└── README.md                   # This file
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 16+ and npm
- Supabase account and project

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edubridge
   ```

2. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # client/.env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database**
   - Go to Supabase Dashboard
   - Open SQL Editor
   - Run `database-schema-clean.sql`

5. **Start development server**
   ```bash
   npm start
   ```

6. **Open browser**
   - Navigate to `http://localhost:3000`
   - Register a new account
   - Explore the platform!

## 🎯 **Usage**

### **For Schools**
1. **Register** as a School Administrator
2. **Add your school** with UDISE ID
3. **Wait for verification** from platform admins
4. **Create funding requests** for scholarships or infrastructure
5. **Track progress** and communicate with donors

### **For Donors/NGOs**
1. **Register** as a Donor
2. **Browse verified requests** from schools
3. **Express interest** in supporting specific requests
4. **Track your impact** and contributions
5. **Connect directly** with schools

### **For Admins**
1. **Register** as an Admin (or be assigned admin role)
2. **Verify schools** and their UDISE IDs
3. **Approve funding requests** for listing
4. **Monitor platform** activity and impact
5. **Manage users** and resolve issues

## 🔒 **Security Features**

- **Row Level Security (RLS)** - Database-level access control
- **Role-based permissions** - Users can only access their own data
- **UDISE ID verification** - Ensures legitimate schools only
- **Secure authentication** - Supabase Auth with email verification
- **Input validation** - Client and server-side validation

## 🌟 **Key Benefits**

### **For Schools**
- **Easy registration** with UDISE ID verification
- **Professional request creation** with detailed descriptions
- **Direct donor connection** without intermediaries
- **Progress tracking** and transparent communication

### **For Donors**
- **Verified recipients** through UDISE ID system
- **Transparent requests** with detailed school information
- **Direct impact** with progress updates
- **Flexible support** options (scholarships or infrastructure)

### **For Platform**
- **Scalable architecture** with Supabase backend
- **Real-time updates** for live request status
- **Comprehensive analytics** for impact measurement
- **Secure and compliant** with educational data standards

## 📊 **Database Schema Overview**

### **Core Tables**
- **`users`** - User accounts with roles (school_admin, donor, admin)
- **`schools`** - School profiles with UDISE verification
- **`requests`** - Funding requests with status tracking
- **`interests`** - Donor interest expressions
- **`updates`** - Progress updates on funded requests

### **Key Relationships**
- Users → Schools (one-to-many for school admins)
- Schools → Requests (one-to-many)
- Users → Interests (one-to-many for donors)
- Requests → Updates (one-to-many)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

If you encounter any issues:

1. **Check the console** for error messages
2. **Verify database setup** using the Database Status indicator
3. **Ensure environment variables** are correctly set
4. **Check Supabase dashboard** for any service issues

## 🎉 **Acknowledgments**

- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the beautiful and responsive design system
- **React** community for the amazing ecosystem
- **Educational institutions** for inspiring this platform

---

**EduLink** - Bridging the gap between educational needs and generous hearts. 💙