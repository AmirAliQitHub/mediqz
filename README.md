# Alqualite CourseBox (آلکالیت اینتراکتیو)

> **Alqualite CourseBox** is a standalone, high-performance interactive cognitive learning web application separated cleanly from test-prep exam engines and importance sliders. It focuses exclusively on interactive mastery through rich educational units (EUs), multi-dimensional recall matrices, and frictionless spaced repetition.

---

## ✦ Core Philosophy & Architecture

- **Name (English):** Alqualite CourseBox
- **Name (Persian):** آلکالیت اینتراکتیو
- **Pure Interactive Focus:** Zero multiple-choice test bank (`qnbank`) dependencies, zero exam rooms, and zero importance sliders or arbitrary priority percentages. Pure pedagogical mastery.
- **Interactive Units Supported:**
  1. `fill_in_the_blank`: Cognitive cloze tests with keyboard navigation and instant feedback.
  2. `literary_matrix`: 4-quadrant interactive discovery for literary history, authors, and centuries.
  3. `correct_incorrect`: Binary verification with conceptual explanation.
  4. `tree_diagram`: Interactive multi-tier taxonomic concept trees.
  5. `learn_box`: Visual cognitive learning cards.

---

## ✦ Tech Stack

- **Backend:** Python 3.10+, FastAPI, SQLite (WAL mode), Pydantic v2.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Design System:** Apple-grade "Liquid Glass" architecture (#f4f8fd base, backdrop-blur caustics, Vazirmatn Persian typography).
- **Engineering Customs:** Equipped with full `.agents/skills` AI craftsmanship suite.

---

## ✦ Getting Started

### 1. Launch All Services (One-Click)
```bash
./start.sh
```

### 2. Manual Startup
**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to explore **Alqualite CourseBox**.
