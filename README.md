# Samarthya AI 🚀

Samarthya AI is a premium, minimalist career guidance platform designed for Grade 8-12 students. It combines advanced AI career roadmapping with direct access to verified mentors for consultation and counselling.

The application has been customized with a **minimalist, monochrome light-theme design system** (similar to Linear and Vercel) to deliver a professional, high-contrast, and focused user experience.

---

## 🛠️ Technology Stack

### Backend
* **Framework:** Django 5.2 (Python 3.13)
* **API Engine:** Django REST Framework (DRF)
* **Authentication:** JWT (JSON Web Tokens) with simple-jwt & Google OAuth (social authentication)
* **Database:** PostgreSQL (with `psycopg2-binary`)

### Frontend
* **Core:** React (Vite, JS)
* **Styling:** Tailwind CSS (configured with custom off-white and charcoal/zinc variables)
* **Icons:** Lucide React

---

## ✨ Primary Features

1. **Role-Based Authentication:**
   * **Students:** Explore custom career roadmaps, discover mentors, and schedule counselling.
   * **Mentors:** Host counselling slots, approve/decline bookings, and manage sessions.
   * **Admins:** High-level user administration (mentor verification, blocking/unblocking accounts).

2. **AI Career Roadmapping:**
   * Generates a tailored 8-10 step milestone sequence based on the student's specific grade, goals, strengths, and selected skills.
   * Tracks progression percentage based on marked milestones.
   * Supports custom roadmap regeneration.

3. **Counselling Slot Bookings:**
   * Browse verified counselling mentors with detailed biographies.
   * Direct consultation booking with automated status handling (Pending ➡️ Confirmed/Declined ➡️ Completed).

---

## ⚙️ Installation & Local Setup

### Prerequisites
* **PostgreSQL** running locally on port `5432` with a database named `samarth`.
* **Node.js** (v18+) and **Python** (v3.10+).

### 1. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and fill in your values (PostgreSQL credentials, Google Client ID, etc.):
   ```bash
   copy .env.example .env
   ```
5. Apply migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### 2. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Default Administrator Login
A default superuser has been seeded in the database for instant access to the **Admin Dashboard**:
* **Email:** `admin@samarthya.ai`
* **Password:** `adminpassword123`

To create additional administrators, execute:
```bash
python manage.py createsuperuser
```
