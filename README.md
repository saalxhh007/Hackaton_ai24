
# 🎯 Real-Time Face Recognition and Person Tracking System

A computer vision-based system that detects and recognizes individuals. It uses face recognition to identify individuals, and real-time tracking to monitor movement.

---

## 🚀 Features

- 🧠 Real-time face detection and recognition
- 🧍 Person tracking with unique ID assignment
- 📊 Admin dashboard to manage and view employee data

---

## 🛠️ Tech Stack

| Component        | Tech Used                     |
|------------------|-------------------------------|
| Face Detection   | InsightFace                   |
| Person Detection | YOLOv8n                       |
| Tracking         | bytetrack                     |
| Embedding DB     | Qdrant (Vector Database)      |
| Backend API      | Django                        |
| Admin Dashboard  | React.js                      |
| Vision Pipeline  | Python + OpenCV               |

---

## ⚙️ How It Works

1. **Person Detection**: Detect people using YOLOv8n and assign temporary IDs.
2. **Face Recognition**: Detect and recognize faces using InsightFace and compare with known embeddings stored in Qdrant.
3. **Tracking**: Continuously track individuals using tetrack.
5. **Logging**: Record events including identity, time, and entry/exit direction.

---

## 🧪 Installation & Setup

### 🔹 Clone the Repository
```bash
git clone https://github.com/saalxhh007/Hackaton_ai24
cd Hackaton_ai24
```


### 🔹 Qdrant (Vector Database)
```bash
# 1. Pull the image
docker pull qdrant/qdrant

# 2. Run the container
docker run -p 6333:6333 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

> On Windows CMD, replace `$(pwd)` with `%cd%`.

---

### 🔹 Backend (Django)
```bash
cd backend

# Run migrations
py manage.py makemigrations
py manage.py migrate
```

---

### 🔹 Admin Dashboard (React)
```bash
cd Dashboard
npm install
```

---

### 🔹 Tracker (Face Recognition + Tracking)
```bash
# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Navigate to tracking server
cd Trakking-server
```

---

## ▶️ Usage

### 1. **Start the Backend**
```bash
cd backend
py manage.py runserver
```

---

### 2. **Start the Dashboard**
```bash
cd Dashboard
npm run dev
```

Then open: [http://localhost:5173/employees](http://localhost:5173/employees)

- Click **"Add Employee"**
- Fill in the details and submit to register a face

---

### 3. **Run the Tracker**
```bash
cd Trakking-server
py main.py
```

The system will now begin tracking and recognizing faces real time.

## 📂 Folder Structure (Optional)
```
project-root/
├── backend/             # Django backend
├── Dashboard/           # React Admin Dashboard
├── Trakking-server/     # Face detection, tracking, recognition
├── requirements.txt     # Python dependencies
└── README.md
```

---

## 🧠 Future Improvements

- WebSocket-based real-time updates on the dashboard
- Room entry/exit detection and logging
- Admin roles & authentication
