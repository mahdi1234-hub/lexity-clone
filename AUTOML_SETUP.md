# AutoML (PyCaret) Integration - Setup & Usage Guide

## What Was Implemented

Full AutoML capabilities powered by **PyCaret** have been integrated into your AI agent. The implementation includes:

### Backend (Python FastAPI - `pycaret-backend/main.py`)
- **1500+ lines** of production-ready FastAPI code
- All PyCaret ML types: Classification, Regression, Clustering, Anomaly Detection, Time Series
- Full pipeline: `setup` → `compare_models` → `tune_model` → `ensemble` → `blend` → `stack` → `calibrate` → `interpret` → `predict` → `finalize` → `save`
- SHAP-based explainability & feature importance plots
- Data quality analysis & preprocessing
- Session management with in-memory storage
- Base64-encoded plot images for seamless frontend display

### Frontend (Next.js)
- **API Proxy Route** (`src/app/api/automl/route.ts`) - Connects Next.js to the Python backend
- **AutoML Dashboard Component** (`src/components/AutoMLDashboard.tsx`) - Full UI with:
  - ML task type selection (Classification, Regression, Clustering, Anomaly Detection, Time Series)
  - Target column selector
  - Advanced preprocessing toggles (normalize, feature selection, outlier removal, imbalance fix)
  - Train/test split slider
  - Clustering/anomaly/time-series specific configs
  - Step-by-step pipeline execution with progress indicators
  - Model comparison leaderboard tables
  - Explainability plots (SHAP, feature importance, learning curves)
  - Prediction preview tables
- **Chat Page Integration** (`src/app/chat/page.tsx`) - "AutoML Pipeline" button appears when CSV is uploaded
- **Updated System Prompt** (`src/app/api/chat/route.ts`) - AI agent now understands and guides users through AutoML

### Supported ML Models
| Type | Models |
|------|--------|
| Classification | Logistic Regression, KNN, Naive Bayes, Decision Tree, SVM, Random Forest, AdaBoost, GBM, XGBoost, LightGBM, CatBoost, Extra Trees, MLP, Ridge, LDA, QDA |
| Regression | Linear Regression, Lasso, Ridge, Elastic Net, Bayesian Ridge, SVR, KNN, Decision Tree, Random Forest, AdaBoost, GBR, XGBoost, LightGBM, CatBoost, MLP |
| Clustering | K-Means, Affinity Propagation, Mean Shift, Spectral, Agglomerative, DBSCAN, OPTICS, Birch, K-Modes |
| Anomaly Detection | Isolation Forest, LOF, KNN, One-class SVM, PCA, Histogram-based, ABOD, COF, MCD |
| Time Series | All PyCaret time series models |

## How to Run Locally

### Step 1: Start the PyCaret Backend (Terminal 1)
```bash
cd /home/ubuntu/Conversational.io/pycaret-backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 2: Start the Next.js Frontend (Terminal 2)
```bash
cd /home/ubuntu/Conversational.io
npm run dev
```

### Step 3: Open in Browser
Go to **http://localhost:3000**, sign in with Google, then:
1. Upload a CSV file in the chat
2. Click the **"AutoML Pipeline"** button that appears
3. Select your ML task type (Classification, Regression, Clustering, etc.)
4. Configure target column & preprocessing options
5. Click **"Run Full AutoML Pipeline"**
6. View results: model leaderboard, metrics, explainability plots, predictions

## Files Created/Modified

### New Files:
- `pycaret-backend/main.py` - Full PyCaret FastAPI backend
- `src/app/api/automl/route.ts` - Next.js API proxy route
- `src/components/AutoMLDashboard.tsx` - AutoML dashboard UI component

### Modified Files:
- `src/app/chat/page.tsx` - Added AutoML button to CSV banner, integrated dashboard
- `src/app/api/chat/route.ts` - Updated system prompt with AutoML awareness
- `.env.local` - Added PYCARET_API_URL=http://localhost:8000
