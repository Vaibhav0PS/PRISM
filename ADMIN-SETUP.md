# 👨‍💼 Admin Dashboard Setup Guide

## 🚀 **Quick Setup (2 minutes)**

### **Step 1: Set Up Database**
```sql
-- Run this in Supabase SQL Editor
-- Copy/paste contents of database-schema-clean.sql
```

### **Step 2: Create Admin Account**
1. **Go to registration page**: `http://localhost:3000/register`
2. **Select "Platform Administrator"** from the Account Type dropdown
3. **Fill in your details**:
   - Full Name: Your Name
   - Email: your-email@example.com
   - Password: (secure password)
   - Role: Platform Administrator
4. **Click "Create Account"**
5. **Complete registration**

### **Step 3: Access Admin Dashboard**
1. **Log in** with your admin credentials
2. **Navigate to**: `http://localhost:3000/admin-dashboard`
3. **You should see the admin interface**

## 🎯 **Admin Dashboard Features**

### **Overview Tab**
- **Platform Statistics**: Total schools, verified schools, pending requests
- **Recent Activity**: Latest schools and requests
- **Quick Actions**: Verify schools, approve requests

### **Schools Management**
- **View All Schools**: List of registered schools
- **Verification Status**: Pending/Verified schools
- **UDISE ID Verification**: Verify school authenticity
- **School Details**: Complete school information

### **Requests Management**
- **All Funding Requests**: View all requests
- **Approval Workflow**: Approve/reject requests
- **Status Tracking**: Monitor request progress
- **Request Details**: Full request information

### **User Management**
- **User Overview**: All platform users
- **Role Management**: Assign/change user roles
- **Activity Monitoring**: User engagement metrics

## 🔧 **Admin Actions**

### **Verify a School**
1. Go to **Schools** tab
2. Find the school to verify
3. Click **"Verify"** button
4. School status changes to "Verified"
5. School can now create funding requests

### **Approve a Request**
1. Go to **Requests** tab
2. Find the request to approve
3. Review request details
4. Click **"Approve"** button
5. Request becomes visible to donors

### **Manage Users**
1. Go to **Users** tab (if available)
2. View user list and activity
3. Change user roles if needed
4. Monitor platform usage

## 🛡️ **Admin Security**

### **Access Control**
- Only users with `role = 'admin'` can access admin dashboard
- Protected routes prevent unauthorized access
- Row Level Security policies enforce permissions

### **Best Practices**
- Use strong passwords for admin accounts
- Regularly review user activities
- Monitor school verification requests
- Keep admin access limited to trusted users

## 🎨 **Customization Options**

### **Add More Admin Features**
```javascript
// In AdminDashboard.js, you can add:
- User management interface
- Advanced analytics
- Bulk operations
- Export functionality
- Email notifications
```

### **Modify Verification Process**
```javascript
// Customize school verification logic
- Add document upload requirements
- Implement multi-step verification
- Add verification comments
- Set verification expiry dates
```

## 📊 **Admin Dashboard Sections**

### **Current Features**
- ✅ **Platform Overview** - Statistics and metrics
- ✅ **School Verification** - Approve/reject schools
- ✅ **Request Management** - Approve funding requests
- ✅ **Activity Monitoring** - Recent platform activity

### **Potential Enhancements**
- 📧 **Email Notifications** - Notify users of status changes
- 📈 **Advanced Analytics** - Detailed platform metrics
- 👥 **User Management** - Comprehensive user administration
- 📄 **Report Generation** - Export platform data
- 🔍 **Audit Logs** - Track admin actions

## 🆘 **Troubleshooting**

### **Can't Access Admin Dashboard**
1. **Check user role**: Ensure role is set to 'admin' in database
2. **Clear browser cache**: Refresh authentication state
3. **Re-login**: Log out and log back in
4. **Check database**: Verify users table exists

### **Admin Features Not Working**
1. **Database setup**: Ensure all tables are created
2. **Permissions**: Check Row Level Security policies
3. **Network**: Verify Supabase connection
4. **Console errors**: Check browser developer tools

### **Database Connection Issues**
1. **Supabase status**: Check Supabase dashboard
2. **Environment variables**: Verify .env file
3. **API keys**: Ensure keys are correct
4. **Network**: Check internet connection

---

## 🎉 **Admin Dashboard Ready!**

With these steps, you'll have full administrative access to:
- Verify schools and their UDISE IDs
- Approve funding requests for listing
- Monitor platform activity and growth
- Manage users and resolve issues

**The admin dashboard provides powerful tools to ensure platform quality and help schools connect with donors effectively.** 👨‍💼