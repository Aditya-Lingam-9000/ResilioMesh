# Resilio Mesh: Complete New Machine Setup & End-to-End Deployment Guide

This document provides a highly detailed, comprehensive, step-by-step guide to migrating, configuring, running, and verifying the entire **Resilio Mesh** system on a completely new laptop or machine. 

By following this guide, you will reproduce the exact working state of the current system, combining a **local offline-first Edge Inference Node** (multimodal vision triage) with a **remote high-performance Basecamp Node** (strategic disaster orchestration).

---

## Table of Contents
1. [System & Architectural Overview](#system--architectural-overview)
2. [Phase 1: Source Code Migration via GitHub](#phase-1-source-code-migration-via-github)
3. [Phase 2: Frontend Environment & Dependency Setup](#phase-2-frontend-environment--dependency-setup)
4. [Phase 3: Local Edge Inference Node Setup (llama.cpp)](#phase-3-local-edge-inference-node-setup-llamacpp)
5. [Phase 4: Remote Basecamp Orchestrator Setup (Google Colab + Ngrok)](#phase-4-remote-basecamp-orchestrator-setup-google-colab--ngrok)
6. [Phase 5: End-to-End System Verification Checklist](#phase-5-end-to-end-system-verification-checklist)
7. [Phase 6: Troubleshooting & Diagnostics Runbook](#phase-6-troubleshooting--diagnostics-runbook)

---

## System & Architectural Overview

The Resilio Mesh is a crisis response platform built on a dual-tier AI coordination architecture:
1. **Local Edge Nodes (Persona A):** Runs locally on responders' laptops. It handles real-time capture from local camera feeds, extracts frames, fetches GPS coordinates, and processes imagery using a locally running Multimodal VLM (`gemma-4-e2b-it` via `llama-server.exe`) to quickly triage risk level, coordinate needs, and list initial recommended actions.
2. **Basecamp Node (Persona B):** Runs a larger Mixture of Experts (MoE) or high-capacity model hosted in a high-compute environment (Google Colab with a T4 GPU). It aggregates all local edge node incident reports from the mesh, builds a unified operational picture, prioritizes targets, and generates a strategic deployment action plan.

```
+--------------------------------------------------------+
|                   LOCAL LAPTOP (EDGE)                  |
|  +--------------------+      +----------------------+  |
|  |   Vite + React     | ---> |   llama-server.exe   |  |
|  |  Local Dashboard   |      |  (Gemma-4-E2B VLM)   |  |
|  +--------------------+      +----------------------+  |
+------------|-------------------------------------------+
             |
      (Ngrok Secure Tunnel)
             |
             v
+--------------------------------------------------------+
|                 REMOTE GOOGLE COLAB                    |
|  +--------------------------------------------------+  |
|  |       FastAPI Server + Pyngrok Tunnel            |  |
|  |     (Gemma-4-E2B-It Strategic Orchestrator)      |  |
|  +--------------------------------------------------+  |
+--------------------------------------------------------+
```

---

## Phase 1: Source Code Migration via GitHub

### Step 1: Clone Code onto the New Machine
On the **new laptop**, open your terminal, navigate to the directory where you want to store the project (e.g., `C:\Users\NEW_USER\Desktop`), and clone the repository:
```powershell
# Clone the repository
git clone https://github.com/Aditya-Lingam-9000/ResilioMesh.git

# Navigate into the project folder
cd ResilioMesh
```

---

## Phase 2: Frontend Environment & Dependency Setup

### Step 1: Install Node.js
On the **new laptop**, download and install the LTS (Long Term Support) version of **Node.js** (v20+ recommended) from the official website: [nodejs.org](https://nodejs.org/).

Verify the installation in terminal:
```powershell
node -v
npm -v
```

### Step 2: Install Node Modules
Navigate to the `frontend/` directory and install all React, Vite, WebRTC, and UI styling dependencies:
```powershell
cd frontend
npm install
```

### Step 3: Configure Environment Variables (`.env`)
Create an environment file inside the `frontend/` directory named exactly `.env`. You can copy the contents from `.env.example`:
```powershell
cp .env.example .env
```

Open `.env` in a text editor (e.g., VS Code or Notepad) and configure the following variables:
```env
# URL for local Edge VLM inference (running via llama-server.exe)
VITE_GEMMA_API_URL=http://127.0.0.1:8080/v1/chat/completions

# URL for the remote Basecamp Orchestrator (Google Colab Ngrok tunnel)
# Note: You will update this URL every time you run a new Google Colab session
VITE_BASECAMP_API_URL=https://your-ngrok-subdomain.ngrok-free.dev
```

---

## Phase 3: Local Edge Inference Node Setup (llama.cpp)

To run offline-first multimodal vision analysis on the edge, the new laptop must host a local `llama-server.exe` instance loading the quantized GGUF weights of the model.

### Step 1: Set Up `llama.cpp` Binary Directory
1. On the **new laptop**, create a folder named `C:\llama.cpp`.
2. Download the pre-built `llama.cpp` Windows release zip file (choose the CUDA or CPU version depending on whether the new laptop has an NVIDIA GPU) from [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases).
3. Extract the contents of the zip file directly into `C:\llama.cpp`. You should see `llama-server.exe` inside that folder.

### Step 2: Download Model Weights
You need to transfer or download two critical files. Create the following folder structure on the new machine:
`C:\Users\NEW_USER\.lmstudio\models\google\gemma-4-e2b-it\`

Download or copy over the following two files:
1. **Model Weights (GGUF):** `gemma-4-E2B-it-Q3_K_M.gguf` (Approx 2.35 GB, highly optimized 3-bit quantization).
2. **Vision Multimodal Projector:** `gemma-4-E2B-it.mmproj-q8_0.gguf` (Visual parsing encoder).

### Step 3: Run the Local Edge Inference Server
Open a **PowerShell** window on the new laptop and execute the following command. 

> [!IMPORTANT]
> The `--reasoning-format none` flag is critical. The Gemma-4-E2B model is a reasoning/thinking VLM. Without this flag, the model will output a huge internal thinking log (`<|think|> ...`), delaying the parsed JSON by up to 2 minutes. Setting it to `none` suppresses this delay, generating instant results.

```powershell
cd C:\llama.cpp

.\llama-server.exe `
  -m "C:\Users\NEW_USER\.lmstudio\models\google\gemma-4-e2b-it\gemma-4-E2B-it-Q3_K_M.gguf" `
  --mmproj "C:\Users\NEW_USER\.lmstudio\models\google\gemma-4-e2b-it\gemma-4-E2B-it.mmproj-q8_0.gguf" `
  -t 4 `
  -c 2048 `
  --host 127.0.0.1 `
  --port 8080 `
  --reasoning-format none
```

*Command Arguments Decoded:*
* `-m`: Specifies the path to the main text model.
* `--mmproj`: Specifies the path to the multimodal projector (enables image parsing).
* `-t 4`: Sets the number of CPU threads to use (set this to match the physical core count of the new laptop).
* `-c 2048`: Configures context window limit.
* `--host 127.0.0.1 --port 8080`: Binds local endpoint (matching `VITE_GEMMA_API_URL`).
* `--reasoning-format none`: Shuts down raw reasoning monologue to bypass output latency.

---

## Phase 4: Remote Basecamp Orchestrator Setup (Google Colab + Ngrok)

The Basecamp Node orchestrates multiple incoming reports using a Google Colab GPU server.

### Step 1: Open Google Colab and Upload Notebook
1. Log in to [Google Colab](https://colab.research.google.com/).
2. Select **Upload**, then upload the file located in your project directory at:
   `notebooks/kaggle_gemma4_multimodal_transformers.ipynb`
3. In Colab, click **Runtime -> Change runtime type**, select **T4 GPU**, and click **Save**.

### Step 2: Configure Colab Secrets
In the left sidebar of your Google Colab window, click the **🔑 (Secrets)** icon and add the following two key-value pairs:
1. `HF_TOKEN`: Paste your Hugging Face User Access Token (ensure you've accepted the Gemma-4 license agreements on Hugging Face).
2. `NGROK_AUTHTOKEN`: Log into your [Ngrok Dashboard](https://dashboard.ngrok.com/), navigate to "Your Authtoken", copy it, and paste it here.
3. **Turn ON the "Notebook access" slider** for both secrets so the Python script can read them.

### Step 3: Run the Server and Extract Ngrok URL
1. In Colab, click **Runtime -> Run all**.
2. Scroll to the bottom of the last running cell. The notebook will download the weights, start a FastAPI server, set up an asynchronous thread, and construct a secure Ngrok tunnel.
3. Look for the printout box at the bottom of the logs:
   ```
   ==================================================
   NGROK PUBLIC URL: https://unhurting-nonmediative-deegan.ngrok-free.dev
   Set this URL as VITE_BASECAMP_API_URL and VITE_KAGGLE_API_URL in your frontend .env
   ==================================================
   ```
4. Copy this public URL.

### Step 4: Link Frontend to Colab Backend
On the **new laptop**, open `frontend/.env` and update the value:
```env
VITE_BASECAMP_API_URL=https://unhurting-nonmediative-deegan.ngrok-free.dev
```

---

## Phase 5: End-to-End System Verification Checklist

Once your environment is set up and configured, perform these verification steps to prove the entire system is working perfectly.

### Step 1: Start the Frontend App
On the new laptop, navigate to the `frontend` folder and boot up the development server:
```powershell
cd frontend
npm run dev
```
Open a browser window and navigate to `http://localhost:5173`.

### Step 2: Test Local Edge VLM Triage
1. On the dashboard homepage, click the **Capture** tab.
2. Ensure "Attach device GPS" is checked. It will locate your coordinates or automatically fall back to standard IP/Wi-Fi positioning.
3. Drag and drop or upload a disaster image (e.g., an image of a fire or flood).
4. You should see the status update: `Sending frames to Gemma...`
5. After processing, the VLM will analyze the image, parse the details, and output a clean triage report in the **Timeline** and **Triage** queues.
6. Click on the report. Verify the risk level, confidence, and recommended responder checklist. Expand **"Debug: Raw Model Output"** at the bottom to inspect the actual raw JSON returned by your local server.

### Step 3: Test Strategic Basecamp Orchestration
1. Upload/seed a few more images in the Capture tab to populate your queue with multiple incidents.
2. Navigate to the newly created **Basecamp** tab in your top navigation menu.
3. You will see a dedicated, premium orchestration console showing the count of current mesh reports.
4. Click **Generate Strategic Plan**.
5. The frontend will package all active incident reports, transmit them over the secure Ngrok tunnel to Google Colab, process them using the high-performance model, and return a comprehensive tactical overview.
6. Verify that the **Situation Summary**, **Priority Targets** list, and **Deployment Action Plan** populate beautifully on your dashboard!

---

## Phase 6: Troubleshooting & Diagnostics Runbook

### 1. "Response mismatch: server returned a different request_id"
*   **Cause:** Smaller local VLM models sometimes drop or change parameters like custom IDs when outputting text.
*   **Resolution:** The frontend has a built-in safety fallback. If the model forgets to return the correct `request_id`, the client will auto-recover it using the matching local cache token. Simply refresh and re-run.

### 2. "GPS Error: Timeout expired"
*   **Cause:** High-accuracy GPS tracking requires an open line of sight to a satellite. Indoors or in dense areas, this times out.
*   **Resolution:** The system now includes an automatic safety downgrade. If high-accuracy fails, it waits 15 seconds and automatically drops to **Standard/Cached Positioning** (via router signals/local IP networks). If it fails permanently, ensure Windows location services are toggled **ON** in *Settings -> Privacy & Security -> Location*.

### 3. "Situation Summary: No summary provided"
*   **Cause:** The remote Colab model returned its response enclosed in markdown syntax (like ` ```json ... ``` `) which broke basic backend parsers.
*   **Resolution:** The dashboard now includes a **Double-Layer Client Parser**. If the Colab backend fails to strip the markdown, the React frontend will intercept the raw response string, scan for brackets `{...}`, extract the valid JSON, and map it directly to the dashboard widgets.

### 4. Local Model Processing takes 2+ Minutes or outputs weird text
*   **Cause:** The `llama-server.exe` was started without the `--reasoning-format none` flag, or CPU threading is too low.
*   **Resolution:** Stop the server (`Ctrl+C` in PowerShell) and restart it. Double-check that `--reasoning-format none` is appended to the end of the starting command and that thread count (`-t`) matches the physical core count of the new machine's processor.
