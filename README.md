# 📊 DiagramSathi - AI-Powered Diagramming Platform

DiagramSathi is a modern, high-fidelity diagramming tool designed for engineers, students (BCA/CS), and system architects. It combines the power of **Google Gemini AI** with **Mermaid.js** and **React Flow** to offer a seamless, bidirectional diagramming experience.

## ✨ Features

- **🤖 AI-Powered Generation**: Describe your system structure in natural language, and let Gemini AI generate the diagram instanty.
- **🎨 Modern IDE Aesthetics**: A sleek Dark Mode interface with Glassmorphism panels and Indigo-Electric accenting.
- **📐 Bidirectional Syncing**:
  - Edit properties in the **Form View**.
  - Modify logic in the **Mermaid Code Editor**.
  - Drag and Resize nodes directly on the **Visual Canvas**.
- **🖼️ 7+ Geometric Shapes**: Support for Rectangles, Squares, Circles, Diamonds, Parallelograms, Hexagons, and Cylinders (e.g., for Datastores).
- **📏 Manual Node Resizing**: Integrated `NodeResizer` allows fine-grained control over node dimensions.
- **🎯 Aspect-Ratio Locking**: Circles and Squares maintain their geometric integrity even when resized or filled with long text.
- **📥 High-Quality Export**: Export your diagrams as PNGs with support for both **Transparent** and **Solid Dark** backgrounds.
- **💾 Metadata Persistence**: Custom positions and sizes are persisted directly within the Mermaid code comments (using `@nodeType`, `@nodeSize`), ensuring your layout is preserved.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Diagramming Engine**: [@xyflow/react (React Flow)](https://reactflow.dev/)
- **AI Integration**: [Google Gemini Pro API (@google/genai)](https://ai.google.dev/)
- **Parsing & Syntax**: [Mermaid.js](https://mermaid-js.github.io/mermaid/#/)
- **Layout Engine**: [Dagre](https://github.com/dagrejs/dagre)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API Key

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/diagram-sathi.git
   cd diagram-sathi
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your Gemini API key:

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📖 Usage

- **Smart Suggest**: Type a project description (e.g., "A banking system where a customer deposits money and the database updates balance") and click **✨ Smart Suggest**.
- **Manual Editing**: Use the left sidebar to add/remove nodes and define data flows.
- **Resizing**: Click on any node in the center canvas to show resize handles.
- **Exporting**: Use the **Export** button in the top navbar to download your final diagram.

## 📜 License

Distributed under the MIT License. See `LICENSE` (if available) for more information.

---

Built with ❤️ by the DiagramSathi Team.
