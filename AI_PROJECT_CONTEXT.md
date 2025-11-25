# ALZAWARE - AI PROJECT CONTEXT
**Last Updated:** Nov 23, 2025
**Status:** Active Development - UI Overhaul Phase

## 1. PROJECT OVERVIEW
*   **Name:** AlzAware
*   **Type:** Medical AI for Alzheimer's Detection (MRI + Cognitive Tests)
*   **Tech Stack:**
    *   **Frontend:** Next.js 15.5.4, React 19.1.0, Tailwind CSS 4
    *   **Backend:** FastAPI (Python)
    *   **Database:** MongoDB
    *   **AI/ML:** PyTorch

## 2. VISUAL DESIGN SYSTEM (CRITICAL)
The application follows a **"Light Medical Premium"** theme designed to convey trust, cleanliness, and high-end technology.

### Background & Atmosphere
*   **Base Gradient:** `bg-gradient-to-br from-blue-50 via-white to-blue-50`
*   **Texture Overlay:** "Dot Grid" pattern (`radial-gradient(#e5e7eb_1px,transparent_1px)`) with `[background-size:20px_20px]`.
*   **Ambient Depth:** Large, animated "Aurora Blobs" (Blue/Purple) with `blur-3xl` and `opacity-30` to add depth without distraction.

### Component Styling
*   **Glassmorphism:** The core card style.
    *   Classes: `bg-white/70 backdrop-blur-md border border-white/50 shadow-sm`
*   **Icons:** `lucide-react` icons are consistently used, often wrapped in colored circular backgrounds (Blue, Green, Purple, Orange) to distinguish actions.
*   **Buttons:** Primary actions use `bg-blue-600` with `hover:bg-blue-700`, featuring soft rounded corners (`rounded-xl`) and shadow effects.

### Trust Signals
*   **Badges:** Floating glass pills on auth pages (e.g., "HIPAA Compliant Security", "AI-Powered Precision") with bounce animations.

## 3. COMPONENT LAYOUT LOGIC

### Authentication Pages (`/login`, `/register`)
*   **Layout:** Full-screen Split-Screen.
    *   **Left:** Scrollable Form Area (Glass card container).
    *   **Right:** "Blue Pulse" Hero Section with gradient overlay and large typography.
*   **Navigation:** Sidebar and Header are **hidden** on these routes for immersion.

### Landing Page (`/`)
*   **Purpose:** High-fidelity marketing entrance for **unauthenticated** users.
*   **Features:** Large Hero section, "How It Works" glass cards, and clear CTAs.
*   **Routing:** Automatically redirects authenticated users to their respective dashboards (`PatientDashboard` or `DoctorDashboard`).

### Patient Dashboard (`PatientDashboard.tsx`)
The dashboard features a specific **"Info-First"** merged layout:
1.  **Welcome Banner:** Glassmorphism header with "System Active" pulse.
2.  **Understanding Your Health:** (Moved to Top) A 3-card row explaining the process (Cognitive Test -> MRI -> Results).
3.  **Quick Actions & Updates:** A split grid.
    *   **Left:** 2x2 Grid of Interactive Cards (Assessment, Chat, Doctors, History).
    *   **Right:** Notifications Feed.
4.  **Reference Guide:** (Bottom) A 4-card grid detailing Alzheimer's detection stages (No Impedance to Moderate).

## 4. PROJECT STRUCTURE
*   **`frontend/`**: Next.js application.
    *   `src/pages/`: Routes (`login.tsx`, `register.tsx`, `index.tsx`, `_app.tsx`).
    *   `src/components/dashboard/`: Dashboard components (`PatientDashboard.tsx`, `DoctorDashboard.tsx`).
    *   `src/components/landing/`: Landing page components.
    *   `src/context/`: State management (`AuthContext.tsx`).
*   **`Modelapi/`**: Backend API (FastAPI) and ML models.

## 5. NEXT STEPS
*   **Backend Integration:** Ensure all new frontend fields (e.g., registration details) map correctly to the API.
*   **Doctor Dashboard:** Apply the new "Light Medical Premium" design system to `DoctorDashboard.tsx` (currently pending).
