"""
Streamlit Frontend
==================
Interactive web interface for the Animal Sound Identification System.

Features:
    - Upload .ogg, .wav, or .mp3 audio files
    - Audio playback
    - Species prediction with confidence score
    - Animal information card
    - Spectrogram visualization
    - Prediction history

Usage:
    streamlit run frontend/app.py
"""

import io
import os
import sys
import time

import matplotlib.pyplot as plt
import numpy as np
import requests
import streamlit as st

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ============================================================
# Page Configuration
# ============================================================
st.set_page_config(
    page_title="Animal Sound Identifier",
    page_icon="🐦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ============================================================
# Custom CSS
# ============================================================
st.markdown("""
<style>
    /* Main theme */
    .main-header {
        text-align: center;
        padding: 1rem 0;
        background: linear-gradient(135deg, #1a5276, #2ecc71);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 3rem;
        font-weight: 800;
    }
    
    .sub-header {
        text-align: center;
        color: #7f8c8d;
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }
    
    /* Info card */
    .info-card {
        background: linear-gradient(145deg, #1a1a2e, #16213e);
        border-radius: 15px;
        padding: 25px;
        margin: 15px 0;
        border: 1px solid #2ecc71;
        box-shadow: 0 4px 15px rgba(46, 204, 113, 0.1);
    }
    
    .info-card h3 {
        color: #2ecc71;
        margin-bottom: 10px;
    }
    
    .info-item {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .info-label {
        color: #95a5a6;
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .info-value {
        color: #ecf0f1;
        font-size: 1.05rem;
        margin-top: 2px;
    }
    
    /* Confidence bar */
    .confidence-container {
        background: #1a1a2e;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        margin: 10px 0;
    }
    
    .confidence-value {
        font-size: 3rem;
        font-weight: 800;
        color: #2ecc71;
    }
    
    /* History */
    .history-item {
        background: rgba(26, 26, 46, 0.5);
        border-radius: 8px;
        padding: 10px 15px;
        margin: 5px 0;
        border-left: 3px solid #3498db;
    }
    
    .stButton > button {
        width: 100%;
        border-radius: 10px;
        padding: 0.75rem 2rem;
        font-weight: 600;
        font-size: 1.1rem;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================
# Backend Configuration
# ============================================================
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

# ============================================================
# Session State Initialization
# ============================================================
if "prediction_history" not in st.session_state:
    st.session_state.prediction_history = []
if "use_direct" not in st.session_state:
    st.session_state.use_direct = False

# ============================================================
# Helper Functions
# ============================================================
def predict_via_api(audio_bytes, filename):
    """Send audio to FastAPI backend for prediction."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/predict",
            files={"file": (filename, audio_bytes)},
            params={"top_k": 5},
            timeout=60,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        st.error("❌ Cannot connect to backend. Make sure it's running: `uvicorn backend.main:app --reload`")
        return None
    except Exception as e:
        st.error(f"❌ API Error: {str(e)}")
        return None


def predict_directly(audio_bytes, filename):
    """Run prediction directly without the FastAPI backend."""
    import tempfile
    from src.phase14_inference import InferencePipeline

    # Cache pipeline in session state
    if "pipeline" not in st.session_state:
        with st.spinner("🔄 Loading model..."):
            st.session_state.pipeline = InferencePipeline()

    suffix = os.path.splitext(filename)[1] or ".ogg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = st.session_state.pipeline.predict(tmp_path, top_k=5)
        # Convert to API-compatible format
        return {
            "predicted_label": result["predicted_label"],
            "common_name": result.get("common_name", result["predicted_label"]),
            "scientific_name": result.get("scientific_name", "N/A"),
            "animal_class": result.get("animal_class", "N/A"),
            "confidence": result["confidence"],
            "habitat": result.get("habitat", "N/A"),
            "diet": result.get("diet", "N/A"),
            "distribution": result.get("geographic_distribution", result.get("distribution", "N/A")),
            "conservation_status": result.get("conservation_status", "N/A"),
            "interesting_facts": result.get("interesting_facts", "N/A"),
            "top_k_predictions": result["top_k_predictions"],
            "spectrogram": result.get("spectrogram"),
        }
    finally:
        os.unlink(tmp_path)


def plot_spectrogram(spec):
    """Plot a spectrogram and return the figure."""
    fig, ax = plt.subplots(figsize=(12, 4))
    img = ax.imshow(spec, aspect="auto", origin="lower", cmap="magma",
                    interpolation="nearest")
    ax.set_xlabel("Time", fontsize=11)
    ax.set_ylabel("Mel Frequency", fontsize=11)
    ax.set_title("Log-Mel Spectrogram", fontsize=13, fontweight="bold")
    plt.colorbar(img, ax=ax, format="%+2.0f dB")
    plt.tight_layout()
    return fig


def get_confidence_color(confidence):
    """Get color based on confidence level."""
    if confidence >= 0.8:
        return "#2ecc71"  # Green
    elif confidence >= 0.5:
        return "#f39c12"  # Orange
    else:
        return "#e74c3c"  # Red


# ============================================================
# Main UI
# ============================================================
st.markdown('<h1 class="main-header">🐦 Animal Sound Identifier</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Upload an audio recording to identify the animal species using AI</p>',
            unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("## ⚙️ Settings")

    mode = st.radio(
        "Inference Mode",
        ["API (via FastAPI)", "Direct (no server)"],
        help="API mode requires the backend to be running. Direct mode loads the model in this process.",
    )
    st.session_state.use_direct = mode == "Direct (no server)"

    st.markdown("---")

    # Prediction History
    st.markdown("## 📜 Prediction History")
    if st.session_state.prediction_history:
        for i, hist in enumerate(reversed(st.session_state.prediction_history[-10:])):
            with st.container():
                st.markdown(
                    f'<div class="history-item">'
                    f'<strong>{hist["common_name"]}</strong><br>'
                    f'<small>{hist["confidence"]*100:.1f}% confidence</small>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
        if st.button("🗑️ Clear History"):
            st.session_state.prediction_history = []
            st.rerun()
    else:
        st.info("No predictions yet. Upload an audio file to get started!")

# Main content
col1, col2 = st.columns([1, 1])

with col1:
    st.markdown("### 🎵 Upload Audio")

    uploaded_file = st.file_uploader(
        "Choose an audio file",
        type=["ogg", "wav", "mp3", "flac"],
        help="Supported formats: .ogg, .wav, .mp3, .flac",
    )

    if uploaded_file is not None:
        # Audio playback
        st.audio(uploaded_file, format=f"audio/{uploaded_file.name.split('.')[-1]}")

        # Predict button
        if st.button("🔍 Identify Species", type="primary", use_container_width=True):
            audio_bytes = uploaded_file.getvalue()

            with st.spinner("🧠 Analyzing audio..."):
                start_time = time.time()

                if st.session_state.use_direct:
                    result = predict_directly(audio_bytes, uploaded_file.name)
                else:
                    result = predict_via_api(audio_bytes, uploaded_file.name)

                elapsed = time.time() - start_time

            if result:
                st.session_state.last_result = result
                st.session_state.last_result["elapsed"] = elapsed

                # Add to history
                st.session_state.prediction_history.append({
                    "common_name": result.get("common_name", "Unknown"),
                    "confidence": result.get("confidence", 0),
                })
                st.rerun()

with col2:
    if "last_result" in st.session_state:
        result = st.session_state.last_result
        confidence = result.get("confidence", 0)
        conf_color = get_confidence_color(confidence)

        # Confidence display
        st.markdown(
            f'<div class="confidence-container">'
            f'<div class="confidence-value" style="color: {conf_color};">'
            f'{confidence * 100:.1f}%</div>'
            f'<p style="color: #95a5a6; margin: 0;">Confidence Score</p>'
            f'</div>',
            unsafe_allow_html=True,
        )

        # Main info card
        st.markdown(
            f"""<div class="info-card">
            <h3>🎯 Prediction Result</h3>
            <div class="info-item">
                <div class="info-label">Common Name</div>
                <div class="info-value">{result.get('common_name', 'N/A')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Scientific Name</div>
                <div class="info-value"><em>{result.get('scientific_name', 'N/A')}</em></div>
            </div>
            <div class="info-item">
                <div class="info-label">Animal Class</div>
                <div class="info-value">{result.get('animal_class', 'N/A')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Habitat</div>
                <div class="info-value">{result.get('habitat', 'N/A')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Diet</div>
                <div class="info-value">{result.get('diet', 'N/A')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Distribution</div>
                <div class="info-value">{result.get('distribution', 'N/A')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Conservation Status</div>
                <div class="info-value">{result.get('conservation_status', 'N/A')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Interesting Facts</div>
                <div class="info-value">{result.get('interesting_facts', 'N/A')}</div>
            </div>
            <div style="margin-top: 10px; color: #7f8c8d; font-size: 0.8rem;">
                ⏱️ Inference time: {result.get('elapsed', 0):.2f}s
            </div>
            </div>""",
            unsafe_allow_html=True,
        )

        # Top-K predictions
        st.markdown("### 🏆 Top Predictions")
        top_preds = result.get("top_k_predictions", [])
        for i, pred in enumerate(top_preds):
            label = pred.get("label", "Unknown")
            conf = pred.get("confidence", 0)
            bar_color = get_confidence_color(conf)
            emoji = "🥇" if i == 0 else ("🥈" if i == 1 else ("🥉" if i == 2 else f"{i+1}."))
            st.markdown(f"{emoji} **{label}**")
            st.progress(conf, text=f"{conf*100:.1f}%")

# Spectrogram visualization
if "last_result" in st.session_state and st.session_state.last_result.get("spectrogram") is not None:
    st.markdown("---")
    st.markdown("### 📊 Spectrogram Visualization")
    spec = st.session_state.last_result["spectrogram"]
    if isinstance(spec, np.ndarray):
        fig = plot_spectrogram(spec)
        st.pyplot(fig)
        plt.close(fig)

# Footer
st.markdown("---")
st.markdown(
    '<p style="text-align: center; color: #7f8c8d;">'
    'Animal Sound Identification System | BirdCLEF 2026 | EfficientNet-B3'
    '</p>',
    unsafe_allow_html=True,
)
