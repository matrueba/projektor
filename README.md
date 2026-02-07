# 🎬 Projektor

> AI-powered multi-scene video generator using open-source models

## 🎥 Example Output

<div align="center">
  <video src="examples/Los_Alamos_1945.webm" width="100%" controls></video>
</div>

## 📖 Table of Contents

- [Example Output](#-example-output)
- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Supported Models](#-supported-models)
- [Performance](#-performance)
- [License](#-license)

---

## ✨ Features

- 🎥 **Multi-scene video generation** - Create complete videos with multiple scenes
- 🖼️ **AI image generation** - Generate scene images with Z-image-turbo
- 📝 **Script generation** - AI-powered scriptwriting with customizable prompts
- 🔧 **Local processing** - All content generated and stored locally
- 🎨 **ComfyUI integration** - Leverage powerful ComfyUI workflows

---

## 📋 Requirements

| Requirement | Version          | Link                               |
| ----------- | ---------------- | ---------------------------------- |
| Node.js     | 18+              | [Download](https://nodejs.org/)    |
| ComfyUI     | Latest           | [Download](https://www.comfy.org/) |
| VRAM        | 8GB+ recommended | -                                  |

### ComfyUI Models Required

Download and install these models in ComfyUI:

- **Image**: Z-image-turbo
- **Video**: Wan2.2 14B

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/matrueba/projektor.git
cd projektor

# Install dependencies
npm install

# Start the application
npm run build
npm run start
```

Access the application at **http://localhost:3000**

---

## ⚙️ Configuration

Create a `.env` file with your LLM provider API key:

```env
API_KEY=your_key_here
```

---

## 📁 Project Structure

```
content/
├── project-1/
│   ├── scene-1/
│   │   ├── images/
│   │   └── videos/
│   └── scene-2/
└── project-2/
```

All generated content is stored in the `content` folder, organized by project and scene.

---

## 🎨 Supported Models

| Type  | Model         | Notes           |
| ----- | ------------- | --------------- |
| Image | Z-image-turbo | Fast generation |
| Video | Wan2.2 14B    | High quality    |

> **Adding new models**: Place the ComfyUI workflow JSON in the `workflows` folder. Note: Some models may not be compatible.

---

## ⚡ Performance

Reference times on **GeForce RTX 4070 Super (12GB VRAM)**:

| Task             | Time  |
| ---------------- | ----- |
| Image generation | ~30s  |
| Video generation | ~5min |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/matrueba">matrueba</a>
</p>
