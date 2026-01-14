<div align="center">
  <img src="public/mockmate-ai.webp" alt="Mockmate AI Hero" width="800" style="border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); margin-bottom: 40px;">

  # 🤖 Mockmate AI
  ### **The Ultimate AI-Powered Interview Preparation Platform**

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Gemini AI](https://img.shields.io/badge/Gemini_AI-Flash-blue?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)

  Mockmate AI is a cutting-edge platform designed to revolutionize how candidates prepare for job interviews. Leveraging the power of Google's Gemini AI, it provides a realistic, interactive, and personalized mock interview experience.

  [Explore Platform](#) • [View Demo](#) • [Report Bug](https://github.com/rakibhassan01/mockmate-ai/issues)
</div>

---

## ✨ Features

- 🎯 **AI-Driven Interviews**: Interactive mock interviews tailored to specific job roles and descriptions.
- 🎙️ **Real-time Speech Recognition**: Seamlessly practice your speaking skills with integrated voice-to-text.
- 📊 **Instant Feedback**: Receive detailed performance analysis and suggestions for improvement immediately after your session.
- 🔒 **Secure Authentication**: Robust user management and social login powered by Clerk.
- 🎨 **Premium UI/UX**: A modern, responsive design built with Tailwind CSS 4.0 and Framer Motion for smooth animations.
- 🌑 **Dark Mode Support**: Optimized for both light and dark environments with Next Themes.

---

## 🚀 Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Engine**: [Google Generative AI (Gemini Flash)](https://deepmind.google/technologies/gemini/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
- **Voice Capabilities**: Web Speech API (`react-speech-recognition`)

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+ installed
- A MongoDB database
- Clerk API Keys
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rakibhassan01/mockmate-ai.git
   cd mockmate-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```bash
mockmate-ai/
├── src/
│   ├── app/           # Next.js App Router routes
│   ├── components/    # Reusable UI components
│   ├── modules/       # Feature-specific logic
│   ├── lib/           # Utility functions and configs
│   └── models/        # Mongoose schemas
├── public/            # Static assets
└── types/             # TypeScript definitions
```

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  Built with ❤️ by [Rakib Hassan](https://github.com/rakibhassan01)
</div>
