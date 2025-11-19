# View Doctor Profiles Feature - Documentation

## Overview
The "View Doctor Profiles" feature allows patients to browse all registered doctors on the AlzAware platform, view their detailed profiles, and assign them as their primary care physician for monitoring their Alzheimer's assessments.

## Feature Components

### 1. Frontend Pages

#### Main Doctor Listing Page
**File:** `frontend/src/pages/view-doctors.tsx`
- Displays all registered doctors in a responsive grid layout
- Includes search functionality to filter by name, email, or specialization
- Shows doctor cards with key information:
  - Profile photo
  - Full name
  - Star rating (4.9/5)
  - Specializations (up to 2 displayed)
  - Years of experience
  - Qualifications/achievements
  - Email contact
  - Hospital affiliation
  - Current patient count
  - "View Full Profile" button

#### Doctor Detail Page
**File:** `frontend/src/pages/doctor/[id].tsx`
- Comprehensive doctor profile page
- Dynamic routing based on doctor ID
- Sections include:
  - **Header**: Photo, name, rating, statistics (patients, experience, certificates)
  - **Contact Information**: Email, phone, hospital, location
  - **Specializations**: All areas of expertise
  - **Education & Qualifications**: Academic history
  - **Career History**: Professional experience
  - **Sidebar**: Availability schedule, research interests, publications
- "Assign as My Doctor" button for patients

### 2. Navigation Updates

#### Header Navigation
**File:** `frontend/src/components/layout/header.tsx`
- Added "View Doctors" link in patient navigation menu
- Conditionally displayed only for patients (not doctors)
- Positioned between "New Assessment" and "Results History"

#### Sidebar Navigation
**File:** `frontend/src/components/layout/sidebar.tsx`
- Added quick-access buttons for patient actions:
  - View Doctors (with Users icon)
  - New Assessment (with FileText icon)
  - Results History (with History icon)
- Enhanced visual design with hover effects

#### Patient Dashboard
**File:** `frontend/src/components/dashboard/PatientDashboard.tsx`
- Updated to show 3-column grid of primary actions
- Added "View Doctors" as a central call-to-action
- Improved visual hierarchy with icons and colors

### 3. Backend Integration

#### Existing API Endpoint
**Endpoint:** `GET /doctors/all`
**File:** `Modelapi/main.py` (lines 457-464)
- Fetches all users with role="doctor"
- Returns list of UserPublic objects including:
  - Basic info (id, email, name, age)
  - Profile photo URL
  - Assigned patients list
  - Professional details (education, specializations, experience, etc.)
- Requires authentication (JWT token)

#### Patient Assignment Endpoint
**Endpoint:** `POST /patient/assign-doctor`
**File:** `Modelapi/main.py` (lines 466-482)
- Allows patients to assign a doctor to themselves
- Request body: `{ "doctor_email": "doctor@example.com" }`
- Updates doctor's assigned_patients array

## User Flow

### For Patients:
1. **Access**: Navigate to "View Doctors" from header or sidebar
2. **Browse**: See all available doctors in grid layout
3. **Search**: Filter doctors by name, email, or specialization
4. **View Profile**: Click "View Full Profile" on any doctor card
5. **Review Details**: See comprehensive information about the doctor
6. **Assign**: Click "Assign as My Doctor" to connect with them
7. **Confirmation**: Receive success message upon assignment

### For Doctors:
- Doctors see their profile in the system
- Cannot access the "View Doctors" page (patient-only feature)
- Can view and manage assigned patients in their dashboard

## Design Specifications

### Color Scheme
- **Primary Blue**: `#2563EB` (buttons, accents)
- **Green**: `#16A34A` (success, qualifications)
- **Purple**: `#9333EA` (specializations)
- **Orange**: `#EA580C` (hospital/location)
- **Background**: Gradient from slate-50 to blue-50

### Typography
- **Headings**: Bold, slate-900
- **Body Text**: Regular, slate-700/600
- **Labels**: Medium, slate-600
- **Icons**: Lucide React (consistent 4-6 size units)

### Layout
- **Grid**: Responsive 1/2/3 columns (mobile/tablet/desktop)
- **Cards**: Shadow-lg, rounded corners, white/90 opacity
- **Spacing**: Consistent 8-unit spacing system
- **Hover Effects**: Scale, shadow, color transitions

## Authentication & Security

### Access Control
- Only authenticated users can access doctor profiles
- Patient role verification enforced in useEffect hooks
- JWT token passed in Authorization header
- Redirects to login if unauthenticated
- Redirects to dashboard if non-patient tries to access

### Data Privacy
- Email addresses displayed to facilitate contact
- Professional details public within platform
- Patient counts aggregated (no patient names shown)
- Profile photos optional

## Testing Checklist

### Frontend Testing
- [ ] Page loads correctly for authenticated patients
- [ ] Search functionality filters doctors accurately
- [ ] Doctor cards display all information properly
- [ ] "View Full Profile" navigates to correct detail page
- [ ] Detail page loads with dynamic ID routing
- [ ] "Assign as My Doctor" button triggers API call
- [ ] Success/error messages display appropriately
- [ ] Navigation links work from all entry points
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Loading states show during API calls

### Backend Testing
- [ ] GET /doctors/all returns all doctors
- [ ] Endpoint requires valid authentication
- [ ] Response includes professional_details field
- [ ] POST /patient/assign-doctor adds patient to doctor's list
- [ ] Assignment endpoint validates doctor exists
- [ ] Cannot assign non-existent doctors

### Integration Testing
- [ ] Frontend correctly fetches and displays backend data
- [ ] Search filters work with all doctor attributes
- [ ] Assignment flow completes successfully
- [ ] Error handling works for network failures
- [ ] Token refresh handled appropriately

## Future Enhancements

### Planned Features
1. **Advanced Filtering**: Filter by specialization, experience, location
2. **Sorting Options**: Sort by rating, experience, patient count
3. **Booking System**: Schedule appointments with doctors
4. **Messaging**: Direct messaging between patients and doctors
5. **Reviews**: Patient reviews and ratings for doctors
6. **Video Consultations**: Integrated telemedicine functionality
7. **Doctor Availability**: Real-time availability calendar
8. **Insurance Integration**: Filter by accepted insurance plans

### Technical Improvements
1. **Pagination**: Handle large numbers of doctors efficiently
2. **Caching**: Cache doctor data to reduce API calls
3. **Infinite Scroll**: Alternative to pagination
4. **Image Optimization**: Lazy load profile photos
5. **Search Debouncing**: Optimize search performance
6. **Error Boundaries**: Better error handling in React
7. **Analytics**: Track which doctors are most viewed

## Files Modified/Created

### Created Files
- `frontend/src/pages/view-doctors.tsx` - Main doctor listing page
- `frontend/src/pages/doctor/[id].tsx` - Doctor detail page
- `VIEW_DOCTORS_FEATURE.md` - This documentation

### Modified Files
- `frontend/src/components/layout/header.tsx` - Added navigation link
- `frontend/src/components/layout/sidebar.tsx` - Added sidebar buttons
- `frontend/src/components/dashboard/PatientDashboard.tsx` - Added quick access button

### Existing Backend (No Changes)
- `Modelapi/main.py` - Already had necessary endpoints

## Dependencies
All dependencies already exist in the project:
- React 19.1.0
- Next.js 15.5.4
- TypeScript 5+
- Lucide React (icons)
- Tailwind CSS 4
- Axios 1.12.2

## Deployment Notes

### Frontend Deployment
1. Ensure all new files are committed to git
2. Run `npm run build` to verify no TypeScript errors
3. Test in development mode: `npm run dev`
4. Deploy to production environment

### Backend Deployment
- No changes required
- Existing endpoints already deployed
- Verify MongoDB has doctor users with professional_details

### Environment Variables
- No new environment variables required
- Uses existing API endpoint: `http://127.0.0.1:8000`

## Support & Maintenance

### Common Issues
1. **Empty Doctor List**: Ensure doctors are registered in MongoDB
2. **Profile Not Loading**: Check doctor _id format matches
3. **Assignment Fails**: Verify JWT token is valid
4. **Images Not Showing**: Check profile_photo_url is accessible

### Monitoring
- Track page views on /view-doctors
- Monitor API response times for /doctors/all
- Log assignment success/failure rates
- Monitor search query patterns

## Conclusion
The View Doctor Profiles feature provides patients with an intuitive way to discover and connect with healthcare providers on the AlzAware platform. The implementation follows existing design patterns, integrates seamlessly with the current architecture, and provides a solid foundation for future enhancements.
