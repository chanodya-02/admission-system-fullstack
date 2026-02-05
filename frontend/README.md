# School Online Admission System (Full Stack)

Full-stack web application built with **Django REST API (MySQL)** and **Next.js + shadcn UI**.
Users can submit admission forms and admins can manage submissions (edit/delete/status update).

## Features
- Form submission with:
  - Dropdown (Grade level)
  - Text input (Applicant name)
  - Radio (Gender)
  - Checkbox (Activities)
  - Image upload (JPG/PNG) + preview
  - Document upload (PDF/DOC/DOCX)
- List view of submissions with:
  - Edit / Delete
  - Status update (Processing / Accepted / Rejected)
- Status summary boxes (counts by status)
- File storage on server (media folders)

---

## Tech Stack
**Frontend:** Next.js, TypeScript, shadcn/ui, TailwindCSS, Axios  
**Backend:** Django, Django REST Framework, MySQL  
**Storage:** Local file storage (media folder)

---

## Project Structure
```txt
admission-system-fullstack/
  backend/
  frontend/
  LLM_CHAT_HISTORY.md
  README.md
