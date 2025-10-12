# Donor Impact Dashboard

## Overview
The Impact Dashboard allows donors to track the real-world impact of their donations through progress photos, student reports, and detailed updates from schools.

## Key Features

### 📊 **Impact Tracking**
- **Visual Progress**: See before/after photos of infrastructure projects
- **Student Progress**: View marksheets, grades, and academic progress reports
- **Timeline Updates**: Chronological progress updates from schools
- **Donation Summary**: Track total committed amounts and their impact

### 🎯 **Dashboard Components**

#### **1. Impact Cards**
Each donation gets its own impact card showing:
- **School Information**: Name, UDISE ID, location
- **Donation Details**: Amount committed and date
- **Personal Message**: Your message to the school
- **Progress Updates**: All updates from the school

#### **2. Progress Updates**
Schools can upload different types of updates:
- **Infrastructure Updates** 🏗️: Construction progress photos
- **Student Progress** 📚: Academic reports and marksheets
- **Completion Updates** ✅: Project completion documentation
- **General Updates** 📋: Other progress information

#### **3. Visual Content**
- **Progress Photos**: Grid layout of construction/project photos
- **Student Reports**: Downloadable academic documents
- **Interactive Gallery**: Click to view full-size images
- **Document Links**: Direct access to student marksheets and reports

## Database Schema

### Impact Updates Table
```sql
CREATE TABLE impact_updates (
    id UUID PRIMARY KEY,
    interest_id UUID REFERENCES interests(id),
    school_id UUID REFERENCES schools(id),
    donor_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    update_type TEXT, -- 'infrastructure', 'student_progress', 'completion', 'general'
    progress_photos TEXT[], -- Array of photo URLs
    student_reports JSONB, -- Student report objects
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Student Reports JSON Structure
```json
[
  {
    "student_name": "John Doe",
    "student_id": "12345",
    "grade": "A+",
    "subject": "Mathematics",
    "document_url": "https://...",
    "report_type": "marksheet"
  }
]
```

## User Experience

### For Donors:
1. **Navigate to Impact Dashboard**: Click "Impact Dashboard" tab
2. **View Donations**: See all committed donations with progress
3. **Track Progress**: View photos and reports uploaded by schools
4. **Download Reports**: Access student marksheets and progress documents
5. **Monitor Timeline**: See chronological updates from schools

### For Schools:
Schools will need functionality to:
1. **Upload Progress Photos**: Construction/infrastructure progress
2. **Submit Student Reports**: Academic progress and marksheets
3. **Create Updates**: Regular progress updates for donors
4. **Manage Timeline**: Keep donors informed of project status

## Implementation Status

### ✅ **Completed**
- Impact Dashboard tab in donor dashboard
- Impact card component with visual design
- Progress photo gallery with click-to-view
- Student reports section with download links
- Database schema for impact updates
- Responsive design for all screen sizes

### 🔄 **Next Steps**
1. **Run Database Setup**: Execute `create-impact-updates-table.sql`
2. **School Upload Interface**: Add impact update functionality to school dashboard
3. **Notification System**: Notify donors when new updates are available
4. **Photo Upload**: Implement image upload for schools
5. **Report Generation**: Tools for schools to generate student reports

## Features in Detail

### 📸 **Progress Photos**
- **Grid Layout**: 2-3 columns responsive grid
- **Hover Effects**: Visual feedback on photo hover
- **Full-Size View**: Click to open photos in new tab
- **Loading States**: Smooth image loading experience

### 📋 **Student Reports**
- **Document Cards**: Clean layout for each report
- **Grade Display**: Visual grade indicators
- **Download Links**: Direct access to documents
- **Student Information**: Name and ID display

### 🎨 **Visual Design**
- **Color Coding**: Different colors for update types
- **Icons**: Meaningful icons for each update type
- **Cards**: Clean card-based layout
- **Typography**: Clear hierarchy and readability

## Impact Metrics

### Transparency Features:
- **Real-time Updates**: See progress as it happens
- **Photo Documentation**: Visual proof of impact
- **Academic Progress**: Track student improvement
- **Timeline View**: Complete project history

### Engagement Benefits:
- **Increased Trust**: Visual proof builds donor confidence
- **Continued Support**: Seeing impact encourages more donations
- **Personal Connection**: Direct link between donor and beneficiaries
- **Accountability**: Schools are motivated to show progress

## Security & Privacy

### Data Protection:
- **RLS Policies**: Donors only see their own impact data
- **Secure URLs**: Protected document and photo access
- **Privacy Controls**: Student information appropriately anonymized
- **Access Control**: Role-based permissions for all data

This Impact Dashboard creates a complete feedback loop between donors and schools, ensuring transparency, accountability, and continued engagement in the educational mission of शिक्षा सेतु.