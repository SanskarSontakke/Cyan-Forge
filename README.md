# Cyan Forge

Cyan Forge is a high-contrast, cyberpunk-themed note-taking application that leverages the power of Google's Gemini AI to generate insightful markdown notes or visual sketches from your photos and videos.

## Features

- **Cyberpunk Interface**: A sleek, high-contrast UI designed for focus and aesthetic appeal.
- **Multimodal Input**: Upload images and videos to generate notes.
- **AI-Powered Note Generation**:
  - **Text Notes**: Generates detailed markdown notes analyzing your media using Gemini.
  - **Visual Notes**: Creates visual sketches or diagrams based on your input using Gemini.
- **Local Persistence**: Notes are saved locally in your browser, ensuring privacy and quick access.
- **Export Options**: Download your notes as Markdown (`.md`) files or Visual notes as Images (`.png`).
- **Responsive Design**: Works seamlessly on desktop and mobile devices.

## Tech Stack

- **Frontend Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Integration**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

You will also need a **Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/).

## Installation & Setup

1. **Clone the repository** (or download the source code):
   ```bash
   git clone <repository-url>
   cd cyan-forge
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open the App**:
   Visit `http://localhost:5173` (or the port shown in your terminal) in your browser.

## Usage

1. **Upload Media**: Click the upload area to select images or videos, or drag and drop them.
2. **Select Mode**:
   - Click **"Analyze Text"** to generate a text-based summary/note.
   - Click **"Generate Visual Note"** to create a visual representation.
3. **View & Manage**: Generated notes appear in the list below. You can delete them or clear your history.
4. **Download**: Click the "Download" button on any note to save it to your device.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
