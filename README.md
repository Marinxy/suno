# 🎵 Suno Catalogue & Workflow

A comprehensive React-based application for managing your Suno AI music production workflow. This app helps you organize tracks, create professional prompts, and manage your entire music production lifecycle from creation to publication.

![Suno App](https://img.shields.io/badge/React-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)
![Vite](https://img.shields.io/badge/Vite-4.4.5-purple.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.0-green.svg)

## ✨ Features

### 🎼 **6-Stage Workflow System**
1. **Create** - Professional prompt generation with Suno best practices
2. **Generate** - Copy-ready prompts for Suno AI
3. **Refine** - Track and manage versions
4. **Master** - Audio processing workflow
5. **Publish** - Publication management
6. **Library** - Complete track catalogue

### 🎯 **Advanced Tag Builder**
- **35+ Music Styles** categorized by genre (Electronic, Rock/Metal, Pop, Orchestral, etc.)
- **20+ Mood Options** (dark, euphoric, ominous, contemplative, etc.)
- **Enhanced Instruments** with production-focused selections
- **Smart Exclude System** with auto-excludes based on style
- **Quality Tags** optimized for Suno output

### 📊 **Professional Prompt Generation**
- **Style Prompt** - Professional production descriptions
- **Lyrics Structure** - Section-based templates with hints
- **Quality Tags** - `[high_fidelity][studio_mix]` format
- **Exclude Terms** - Smart filtering for common Suno issues

### 🎵 **Audio Management**
- **SoundCloud Integration** - Import tracks and albums via URL
- **Built-in Audio Player** - HTML5 audio with SoundCloud API support
- **Track Status Management** - Generated → Selected → Mastered → Published
- **Album & Playlist Creation** - Organize your music library

### 🔗 **URL Import System**
- **SoundCloud oEmbed API** - Automatic metadata extraction
- **Suno URL Support** - Track metadata parsing
- **Batch Album Import** - Import entire SoundCloud sets
- **Smart Thumbnail Handling** - Image preview and URL management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Marinxy/suno.git
   cd suno
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🎵 Usage Guide

### 1. Create Professional Prompts
- Select up to 3 music styles from categorized options
- Choose mood, tempo, and vocal preferences
- Add instruments and configure exclude terms
- Generate 4 copy-ready prompt outputs

### 2. Transfer to Generation
- Create a project with all generated prompts
- Copy prompts directly to Suno AI
- Track project metadata and settings

### 3. Import Your Music
- **SoundCloud URLs**: `https://soundcloud.com/artist/track`
- **SoundCloud Albums**: `https://soundcloud.com/artist/sets/album`
- **Suno URLs**: `https://suno.com/song/[id]`

### 4. Organize Your Library
- Create albums and playlists
- Filter by style, status, year, or artist
- Tree-view navigation for easy browsing
- Track status across the production workflow

## 🛠️ Technical Details

### Architecture
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Build Tool**: Vite for fast development
- **State Management**: React hooks with localStorage persistence
- **Audio**: HTML5 Audio API with SoundCloud integration

### Data Models
```typescript
type Project = {
  id: string;
  name: string;
  originalPrompt: string;
  stylePrompt?: string;
  lyrics?: string;
  qualityTags?: string;
  excludeTerms?: string;
  status: "active" | "completed" | "archived";
}

type Track = {
  id: string;
  project: string;
  song: string;
  version: string;
  styles: string[];
  status: "generated" | "selected" | "mastered" | "published";
  // ... additional metadata
}
```

### Key Components
- **SunoApp.tsx** - Main application component (3000+ lines)
- **Tag Builder** - Sophisticated prompt generation system
- **Audio Player** - SoundCloud-integrated playback
- **Library System** - Track and album management
- **URL Ingestion** - Metadata extraction and import

## 📁 Project Structure

```
suno_app/
├── src/
│   ├── SunoApp.tsx          # Main application component
│   ├── App.tsx              # App wrapper
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── docs/                    # Documentation and PDFs
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
└── README.md               # This file
```

## 🎯 Production Best Practices

### Suno Optimization
- **Style Prompts**: Professional production language
- **Quality Tags**: Studio-grade specifications
- **Exclude Terms**: Common issue prevention
- **Instrument Limits**: Max 4 for clarity

### Performance
- **Local Storage**: Persistent data without backend
- **Memoization**: Optimized re-renders
- **Lazy Loading**: Efficient component loading
- **Audio Streaming**: SoundCloud API integration

## 🔧 Configuration

### SoundCloud API (Optional)
For audio playback functionality:
1. Register at [SoundCloud Developers](https://developers.soundcloud.com/)
2. Get your Client ID and Client Secret
3. Enter credentials in the app's SoundCloud API section

### Environment Variables
```bash
# Optional - for future API integrations
VITE_SOUNDCLOUD_CLIENT_ID=your_client_id
VITE_SOUNDCLOUD_CLIENT_SECRET=your_client_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Suno AI** - For the amazing music generation platform
- **SoundCloud** - For the audio streaming and metadata APIs
- **React Team** - For the excellent development framework
- **Tailwind CSS** - For the utility-first styling approach

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for music producers using Suno AI**
