# 🐦 Animal Sound Identification System

## BirdCLEF 2026 | EfficientNet-B3 | PyTorch | Hybrid Local & Google Colab Workflow

An end-to-end machine learning system that identifies animal species from audio recordings using the **BirdCLEF 2026** dataset. The system classifies audio recordings into species categories and displays comprehensive ecological information through a web application powered by **FastAPI** and **Streamlit**.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Local vs. Google Colab Workflow](#-local-vs-google-colab-workflow)
   - [Workflow Execution Matrix](#workflow-execution-matrix)
   - [Step 1: Local EDA & Preprocessing](#step-1-local-eda--preprocessing)
   - [Step 2: Transfer Data to Google Colab](#step-2-transfer-data-to-google-colab)
   - [Step 3: Model Training & Tuning on Google Colab GPU](#step-3-model-training--tuning-on-google-colab-gpu)
   - [Step 4: Download Saved Artifacts to Local Project](#step-4-download-saved-artifacts-to-local-project)
   - [Step 5: Local Evaluation, Inference & Deployment](#step-5-local-evaluation-inference--deployment)
4. [Project Structure](#-project-structure)
5. [Setup & Installation](#-setup--installation)
   - [Local Setup](#1-local-environment-setup)
   - [Google Colab Setup](#2-google-colab-environment-setup)
6. [Detailed Script & Module Reference](#-detailed-script--module-reference)
7. [Running the Application](#-running-the-application)
8. [Model Architecture & Hyperparameters](#-model-architecture--hyperparameters)
9. [Evaluation Metrics & Artifacts](#-evaluation-metrics--artifacts)
10. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🎯 Project Overview

This project implements a **single-label, multi-class classification system** for animal vocalizations (birds, mammals, amphibians, reptiles, and insects):

- **Data Processing**: Peak normalization, silence removal, fixed 5-second windowing.
- **Feature Representation**: 3-channel Log-Mel Spectrograms (128 Mel bands, 32kHz sampling rate).
- **Deep Learning Backbone**: Pretrained EfficientNet-B3 with custom classification head.
- **Hybrid Infrastructure**: Data preparation on local CPU; GPU acceleration on Google Colab; local deployment & web UI.

---

## 🛠️ Tech Stack

| Component               | Technology                          |
|-------------------------|-------------------------------------|
| Programming Language    | Python 3.9+ & TypeScript            |
| Audio Processing        | Librosa                             |
| Deep Learning Framework | PyTorch & torchvision               |
| Backbone Model          | EfficientNet-B3 (Transfer Learning) |
| Hyperparameter Tuning   | Optuna                              |
| Data Handling           | Pandas, NumPy, Scikit-learn         |
| Backend API             | FastAPI, Uvicorn, PyMySQL           |
| Frontend Web Interface  | React 18 + TypeScript + Vite        |
| Database Engine         | MySQL Workbench / MySQL & SQLite    |
| Cloud Compute           | Google Colab (Tesla T4 / V100 GPU)  |

---

## 🔄 Local vs. Google Colab Workflow

To leverage GPU hardware on Google Colab for fast training while retaining complete local dataset control, follow this split workflow:

### Workflow Execution Matrix

| Phase / Script | Where to Run | Purpose | Key Inputs | Output Files |
| :--- | :--- | :--- | :--- | :--- |
| **`scripts/run_eda.py`** | 💻 **Local System** | Analyze class balance, audio duration, recording quality | `data/birdclef-2026/train.csv` | `outputs/eda/*` |
| **`scripts/run_preprocessing.py`** | 💻 **Local System** | Clean metadata, split train/val/test, encode labels, build DB | `data/birdclef-2026/train.csv`, `taxonomy.csv` | `outputs/cleaned/*.csv`, `outputs/models/label_encoder.pkl`, `database/animal_info.db` |
| **Data Transfer** | ☁️ **Local ➔ Colab** | Transfer project repository & preprocessed data splits to Colab | `outputs/cleaned/*`, `data/birdclef-2026/*` | Cloud directory (`/content/wildlife`) |
| **`scripts/run_training.py`** | ☁️ **Google Colab (GPU)** | Train EfficientNet-B3 model with GPU acceleration | `train_split.csv`, `val_split.csv`, audio files | `outputs/models/best_model.pth`, `model_config.json`, `training_history.json` |
| **`scripts/run_tuning.py`** *(Optional)* | ☁️ **Google Colab (GPU)** | Run Optuna hyperparameter trials | `train_split.csv`, `val_split.csv` | `outputs/tuning/optuna_study.pkl` |
| **Artifact Transfer** | ☁️ **Colab ➔ Local** | Download trained model checkpoint & config back to local | `outputs/models/*` | `outputs/models/` on Local machine |
| **`scripts/run_evaluation.py`** | 💻 **Local System** | Evaluate trained model on test set, calculate metrics | `test_split.csv`, `best_model.pth` | `outputs/evaluation/*` |
| **`scripts/run_inference.py`** | 💻 **Local System** | Single audio file prediction CLI | Input audio file (`.ogg`/`.wav`) | Formatted predictions |
| **`backend/main.py` & `frontend/app.py`** | 💻 **Local System** | Serve FastAPI REST API and interactive Streamlit web dashboard | `best_model.pth`, `label_encoder.pkl`, `animal_info.db` | Live Web Application |

---

### Step 1: Local EDA & Preprocessing

Execute data preparation locally without requiring GPU compute:

```bash
# 1. Run Exploratory Data Analysis (Generates figures in outputs/eda/)
python scripts/run_eda.py

# 2. Run Preprocessing Pipeline (Data cleaning, dataset splitting, label encoding, database creation)
python scripts/run_preprocessing.py
```

**Output Verification**:
Check that the following files exist in `outputs/cleaned/` and `outputs/models/`:
- `outputs/cleaned/train_cleaned.csv`
- `outputs/cleaned/train_split.csv`
- `outputs/cleaned/val_split.csv`
- `outputs/cleaned/test_split.csv`
- `outputs/models/label_encoder.pkl`
- `outputs/models/class_mapping.json`
- `database/animal_info.db`

---

### Step 2: Transfer Data to Google Colab

Choose one of the two transfer methods below:

#### Option A: Google Drive Integration (Recommended)
1. Zip or copy your local project folder (or `outputs/cleaned` + `data/birdclef-2026/train_audio`) to your **Google Drive**.
2. Open a new Google Colab notebook and set **Runtime Type** to **GPU** (T4 or higher).
3. Mount Google Drive in Colab:
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```
4. Copy/unzip project into Colab environment:
   ```bash
   !cp -r /content/drive/MyDrive/wildlife /content/wildlife
   %cd /content/wildlife
   !pip install -r requirements.txt
   ```

#### Option B: Direct Zip Upload
1. Zip the local codebase and preprocessed files:
   ```bash
   # On local terminal (zip codebase and cleaned data)
   tar -czvf wildlife_colab.tar.gz config.py src/ scripts/ requirements.txt outputs/cleaned/ data/birdclef-2026/
   ```
2. Upload `wildlife_colab.tar.gz` directly into Colab file manager or using Kaggle/gdown API.
3. Extract in Colab:
   ```bash
   !tar -xzvf wildlife_colab.tar.gz -C /content/
   %cd /content/wildlife
   !pip install -r requirements.txt
   ```

---

### Step 3: Model Training & Tuning on Google Colab GPU

Run training scripts inside Google Colab taking full advantage of GPU acceleration:

```python
# Verify GPU availability
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Device Name: {torch.cuda.get_device_name(0)}")

# Run Hyperparameter Tuning (Optional)
!python scripts/run_tuning.py --n-trials 30

# Run Model Training
!python scripts/run_training.py --epochs 40 --batch-size 32
```

---

### Step 4: Download Saved Artifacts to Local Project

Once training finishes, all model artifacts are saved in `outputs/models/`:
- `best_model.pth` *(PyTorch weights state dict)*
- `label_encoder.pkl` *(Scikit-Learn LabelEncoder)*
- `class_mapping.json` *(Species label mapping)*
- `model_config.json` *(Model hyperparameters & audio settings)*
- `training_history.json` *(Per-epoch loss & accuracy history)*

#### Download Commands in Colab:

```python
# Method 1: Copy directly to Google Drive
!cp -r outputs/models /content/drive/MyDrive/wildlife/outputs/

# Method 2: Zip and download via browser
!zip -r saved_models.zip outputs/models/
from google.colab import files
files.download('saved_models.zip')
```

Place the extracted artifact files directly into your local project folder at:
`<project_root>/outputs/models/`

---

### Step 5: Local Evaluation, Inference & Deployment

Now that the trained model parameters are placed back in `<project_root>/outputs/models/`, run evaluation and launch the application locally.

#### 1. Evaluate Model Performance on Local Test Set
```bash
python scripts/run_evaluation.py
```
*Outputs confusion matrix, classification report, and overall metrics to `outputs/evaluation/`.*

#### 2. Perform Single File Audio Prediction (CLI)
```bash
python scripts/run_inference.py --audio data/birdclef-2026/train_audio/skylark/XC123456.ogg --top-k 5
```

#### 3. Launch Web Application (FastAPI + Streamlit)
```bash
# Terminal 1: Start FastAPI Backend API
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Streamlit Web Frontend
streamlit run frontend/app.py
```
Open **http://localhost:8501** in your browser to interact with the system!

---

## 📁 Project Structure

```
wildlife/
├── config.py                       # Central configuration (audio specs, hyperparameters, paths)
├── requirements.txt                # Python dependencies
├── README.md                       # Documentation file
│
├── data/birdclef-2026/             # Dataset directory
│   ├── train.csv                   # Raw audio metadata
│   ├── taxonomy.csv                # Species taxonomy & ecological information
│   └── train_audio/                # Audio recordings (.ogg / .wav)
│
├── src/                            # Source modules (15-phase architecture)
│   ├── phase01_eda.py              # Exploratory Data Analysis & visual plots
│   ├── phase02_cleaning.py         # Outlier removal & low-quality filtering
│   ├── phase03_preprocessing.py    # Audio loading, peak normalization & cropping
│   ├── phase04_augmentation.py     # SpecAugment, pitch shift & time stretch
│   ├── phase05_features.py         # Log-Mel Spectrogram extraction
│   ├── phase06_labels.py           # Species LabelEncoder & index maps
│   ├── phase07_splitting.py        # Stratified Train/Val/Test splitting
│   ├── phase08_model.py            # EfficientNet-B3 architecture definition
│   ├── phase09_training.py         # Two-stage PyTorch training loop & early stopping
│   ├── phase10_regularization.py   # Underfitting/overfitting diagnostic utilities
│   ├── phase11_tuning.py           # Optuna hyperparameter optimization
│   ├── phase12_evaluation.py       # Metrics, confusion matrix & misclassification reports
│   ├── phase13_saving.py           # Model state dict & metadata exporter
│   ├── phase14_inference.py        # Inference pipeline (Audio -> Model -> Species Info)
│   ├── phase15_database.py         # SQLite database creation & querying
│   ├── dataset.py                  # PyTorch Dataset & DataLoader construction
│   └── utils.py                    # Logging, seeds, device helpers
│
├── scripts/                        # Standalone executable scripts
│   ├── run_eda.py                  # Executed locally
│   ├── run_cleaning.py             # Executed locally
│   ├── run_preprocessing.py        # Executed locally
│   ├── run_training.py             # Executed on Google Colab (GPU)
│   ├── run_tuning.py               # Executed on Google Colab (GPU)
│   ├── run_evaluation.py           # Executed locally
│   ├── run_inference.py            # Executed locally
│   └── run_full_pipeline.py        # End-to-end full execution runner
│
├── backend/                        # FastAPI REST API Backend
│   ├── main.py                     # API server endpoints (/predict, /species, /health)
│   ├── schemas.py                  # Pydantic request/response data models
│   └── inference_service.py        # Service wrapper for model inference & DB lookup
│
├── frontend/                       # Streamlit Web UI Frontend
│   └── app.py                      # Interactive UI dashboard for audio upload & prediction
│
├── outputs/                        # Artifacts & Output directory
│   ├── eda/                        # EDA plots (class balance, duration distribution)
│   ├── cleaned/                    # Processed CSVs (train_cleaned.csv, splits)
│   ├── models/                     # Saved models (best_model.pth, label_encoder.pkl, etc.)
│   ├── evaluation/                 # Metrics JSON, confusion matrices, reports
│   ├── tuning/                     # Optuna trial logs & best parameters
│   └── logs/                       # Execution log files
│
└── database/                       # SQLite Database directory
    └── animal_info.db              # Animal ecological taxonomy database
```

---

## ⚙️ Setup & Installation

### 1. Local Environment Setup

```bash
# Clone or navigate to the project directory
cd wildlife

# Create a virtual environment
python -m venv venv

# Activate Virtual Environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

### 2. Google Colab Environment Setup

In your Google Colab notebook, run:

```python
# Check GPU assignment
!nvidia-smi

# Install project dependencies
!pip install -q torchaudio timm optuna librosa pandas numpy scikit-learn
```

---

## 🔍 Detailed Script & Module Reference

- **`python scripts/run_eda.py`**
  Computes species frequencies, missing value stats, audio duration histograms, and audio quality distributions. Saves visual plots to `outputs/eda/`.

- **`python scripts/run_preprocessing.py`**
  Executes Phase 2 (Cleaning), Phase 7 (Stratified Splitting), Phase 6 (Label Encoding), and Phase 15 (SQLite Database). Generates `outputs/cleaned/train_split.csv`, `val_split.csv`, `test_split.csv`, `outputs/models/label_encoder.pkl`, and `database/animal_info.db`.

- **`python scripts/run_training.py`**
  Loads preprocessed CSV splits, constructs PyTorch DataLoaders with Log-Mel feature extraction, initializes EfficientNet-B3, performs two-stage training (head-only followed by backbone fine-tuning), and saves trained artifacts to `outputs/models/`. Accepts flags `--epochs`, `--batch-size`, `--subset`, `--freeze-epochs`, `--lr`.

- **`python scripts/run_tuning.py`**
  Launches Optuna search across learning rates, dropout ratios, weight decay, and unfrozen layers. Saves best parameters to `outputs/tuning/`.

- **`python scripts/run_evaluation.py`**
  Evaluates `outputs/models/best_model.pth` on `outputs/cleaned/test_split.csv`. Computes accuracy, precision, recall, F1-score, top-k accuracy, confusion matrix, and misclassification pairs. Saves outputs to `outputs/evaluation/`.

- **`python scripts/run_inference.py --audio <filepath>`**
  Loads saved model artifacts, preprocesses the target audio file, generates species predictions with confidence percentages, and queries SQLite database for ecological facts.

---

## 🚀 Running the Application

### Option A: FastAPI Backend + Streamlit Frontend (Recommended)

1. **Start FastAPI REST Server**:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Interactive API Docs will be available at: http://localhost:8000/docs*

2. **Start Streamlit Dashboard**:
   ```bash
   streamlit run frontend/app.py
   ```
   *Web application opens automatically at: http://localhost:8501*

### Option B: Direct Frontend Mode (No REST API Server Required)

In the Streamlit app sidebar settings, set **Inference Mode** to `Direct (no server)`. Streamlit will load `outputs/models/best_model.pth` directly in-process without requiring the FastAPI backend server to be running.

---

## 🏗️ Model Architecture & Hyperparameters

```
Audio Input (32kHz, 5 seconds)
       │
       ▼
Log-Mel Spectrogram (128 Mel bins x 501 Time frames)
       │
       ▼
3-Channel Input Expansion (Repeated across RGB channels)
       │
       ▼
EfficientNet-B3 Backbone (Pretrained on ImageNet)
       │
       ▼
Global Average Pooling (1536 channels)
       │
       ▼
Classifier Head:
  ├── BatchNorm1d(1536)
  ├── Dropout(p=0.4)
  ├── Linear(1536 ➔ 512) + ReLU
  ├── BatchNorm1d(512)
  ├── Dropout(p=0.2)
  └── Linear(512 ➔ num_classes)
```

### Key Hyperparameters (`config.py`)

| Parameter | Value | Description |
|---|---|---|
| `SAMPLE_RATE` | `32000 Hz` | Target audio sample rate |
| `AUDIO_DURATION` | `5 seconds` | Segment length for training & prediction |
| `N_MELS` | `128` | Mel filterbanks for spectrogram |
| `HOP_LENGTH` | `320` | Hop size for STFT |
| `BATCH_SIZE` | `32` | Training batch size |
| `NUM_EPOCHS` | `40` | Total training epochs |
| `FREEZE_EPOCHS` | `5` | Stage 1 (classifier head training only) |
| `LEARNING_RATE_HEAD` | `0.001` | Initial learning rate for head |
| `LEARNING_RATE_FINETUNE` | `0.0001` | LR for backbone fine-tuning |
| `WEIGHT_DECAY` | `1e-4` | L2 weight regularization |
| `DROPOUT_RATE` | `0.4` | Head dropout probability |
| `EARLY_STOPPING_PATIENCE`| `7` | Patience before early stopping |

---

## 📊 Evaluation Metrics & Artifacts

After running evaluation (`python scripts/run_evaluation.py`), the following artifacts are stored in `outputs/evaluation/`:

- `metrics.json`: Overall metrics (Accuracy, Top-3/Top-5 Accuracy, Macro/Weighted F1, Precision, Recall).
- `confusion_matrix.png`: Heatmap visualization of species classifications.
- `classification_report.txt`: Per-species classification breakdown.
- `training_history.png`: Epoch-by-epoch Train vs. Validation Loss and Accuracy curves.
- `misclassification_report.json`: Detailed list of most frequently confused species pairs.

---

## ❓ Troubleshooting & FAQs

### Q1: `FileNotFoundError: outputs/cleaned/train_split.csv not found`
**Solution**: You forgot to run the local preprocessing script first. Run `python scripts/run_preprocessing.py` on your local system before transferring files or starting training.

### Q2: `CUDA Out of Memory` error on Google Colab
**Solution**: Reduce batch size during training:
```bash
python scripts/run_training.py --batch-size 16
```

### Q3: How do I verify the saved model works locally after downloading from Colab?
**Solution**: Ensure the contents of your download are unzipped directly into `<project_root>/outputs/models/`. Run a test inference command:
```bash
python scripts/run_inference.py --audio data/birdclef-2026/train_audio/<any_species>/<file>.ogg
```

### Q4: "No module named 'config'" when executing scripts
**Solution**: Always run commands from the project root directory (`wildlife`), or run python with `-m`:
```bash
cd wildlife
python scripts/run_training.py
```

---

## 📄 License & Credits

- **Dataset**: [BirdCLEF 2026 Kaggle Competition](https://www.kaggle.com/competitions/birdclef-2026)
- **Model Architecture**: EfficientNet (Tan & Le, 2019) via PyTorch `timm` / `torchvision`.
- **Purpose**: Developed for academic research, animal species conservation, and college internship project presentation.
