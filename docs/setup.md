

# Setup Instructions - Explicit Agent Protocol + KG Memory

## 📋 ข้อกำหนดเบื้องต้น

### ระบบปฏิบัติการที่รองรับ
- **Windows 10/11** (PowerShell 5.1+, Windows Subsystem for Linux แนะนำ)
- **macOS** (10.15 Catalina+, Apple Silicon และ Intel)
- **Linux** (Ubuntu 18.04+, CentOS 7+, Debian 10+)

### Software Requirements

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **Node.js** | ≥ 18.0.0 LTS | [Download](https://nodejs.org/) | Long Term Support version |
| **npm** | ≥ 8.0.0 | [npmjs.com](https://www.npmjs.com/) | มาพร้อม Node.js |
| **Git** | ≥ 2.25.0 | [Download](https://git-scm.com/) | สำหรับ clone repository |
| **VS Code** | ≥ 1.60 | [Download](https://code.visualstudio.com/) | แนะนำสำหรับ development |

### Hardware Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **RAM** | 4GB | 8GB+ | สำหรับ batch processing และ caching |
| **Storage** | 500MB | 2GB+ | Dependencies + data storage |
| **CPU** | Dual-core | Quad-core+ | Multi-threading สำหรับ embedding |
| **Network** | Broadband | 100Mbps+ | สำหรับ API calls (OpenAI/HuggingFace) |

## 🚀 การติดตั้งขั้นตอนละเอียด

### Step 1: ติดตั้ง Node.js

#### Windows
1. ดาวน์โหลด Node.js LTS จาก [nodejs.org](https://nodejs.org/)
2. รัน installer และทำตามขั้นตอน (เลือก "Add to PATH")
3. เปิด **Command Prompt** หรือ **PowerShell** ใหม่
4. ตรวจสอบการติดตั้ง:
```cmd
node --version
npm --version
```
**Expected:** `v18.x.x` และ `8.x.x` หรือสูงกว่า

#### macOS
```bash
# ใช้ Homebrew (แนะนำ)
brew install node

# หรือใช้ nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# ตรวจสอบ
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install using NodeSource repository (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# ตรวจสอบ
node --version
npm --version

# Optional: Install yarn
npm install -g yarn
```

### Step 2: ติดตั้ง Git

#### Windows
1. ดาวน์โหลด Git จาก [git-scm.com](https://git-scm.com/download/win)
2. รัน installer เลือก:
   - **"Git from the command line and also from 3rd-party software"**
   - **"Use Windows default console window"**
   - **"Checkout Windows-style, commit Unix-style line endings"**
3. ตรวจสอบ:
```cmd
git --version
```

#### macOS
```bash
# Homebrew
brew install git

# หรือ Xcode Command Line Tools
xcode-select --install

# ตรวจสอบ
git --version
```

#### Linux
```bash
# Ubuntu/De