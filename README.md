# 📊 DiagramSathi

### AI-Powered High-Fidelity Diagramming Platform

**DiagramSathi** is a modern, intelligence-first diagramming tool built for developers, students, and architects. It transforms natural language descriptions into professional, structured diagrams using **Groq API**, **React Flow**, and the **ELK Layout Engine**.

---

## ✨ Key Features

- **🤖 AI-First Generation**: Describe complex systems (e.g., "A Level 1 DFD for an E-commerce inventory system") and get an instant, auto-layouted diagram.
- **📐 High-Fidelity Layouts**: Integrated with **ELKJS** and **Dagre** for professional-grade polyline edge routing and automatic node positioning.
- **🏗️ Specialized DFD Support**: Native support for Data Flow Diagrams (Processes, Data Stores, Entities) with specialized node types and hierarchical levels (0-N).
- **💾 Full Persistence**: Save, manage, and version your projects via **Supabase**. Supports drafts, active projects, and a dedicated trash system.
- **🎮 3D Experience**: A stunning, interactive 3D hero section powered by **Spline** for a premium first impression.
- **🎨 Modern IDE Aesthetics**: Built with **Tailwind CSS v4**, featuring a sleek dark mode, glassmorphism panels, and high-performance animations via **Framer Motion**.
- **📥 Professional Export**: Export your diagrams as high-resolution PNGs with support for transparent or solid backgrounds.
- **🔄 Sequential Generation**: Add to existing diagrams seamlessly. AI-generated content appends to the right of your current canvas without overwriting your work.

---

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8 (Beta)](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Diagramming**: [@xyflow/react (React Flow)](https://reactflow.dev/)
- **Layout Engines**: [ELKJS](https://github.com/kieler/elkjs) & [Dagre](https://github.com/dagrejs/dagre)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **AI Integration**: [Groq API](https://console.groq.com/docs/overview)
- **3D Graphics**: [@splinetool/react-spline](https://spline.design/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher (recommended for React 19 compatibility)
- **Supabase**: A Supabase project for backend functionality.
- **Groq API Key**: [Groq API](https://console.groq.com/docs/overview)

### Installation

1. **Clone the repo**:

   ```bash
   git clone https://github.com/your-username/DiagramSathi.git
   cd DiagramSathi/diagram-sathi
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file in the `diagram-sathi/` directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
diagram-sathi/
├── src/
│   ├── components/       # Specialized UI & Diagram components (Nodes, Edges)
│   ├── store/            # Zustand state (useDiagramStore.ts)
│   ├── utils/            # Layout logic (ELK, Dagre) & AI Services
│   ├── lib/              # Supabase & shared clients
│   ├── pages/            # Landing, Editor, Dashboard, Auth
│   └── layouts/          # Application shell & navigation
├── public/               # Static assets & logos
└── supabase/             # Edge Functions & Migrations
```

---

## 📖 Usage Tips

- **Smart Prompting**: Use specific keywords like "Level 0 DFD" or "ER Diagram" in the AI prompt for better results.
- **Layout Refresh**: Use the "Magic Wand" or "Layout" buttons in the editor to trigger the ELK layout engine if nodes overlap during manual editing.
- **Pan & Zoom**: Use the mouse wheel or trackpad to zoom, and `Space + Drag` to pan the canvas.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by the **DiagramSathi Team**.
