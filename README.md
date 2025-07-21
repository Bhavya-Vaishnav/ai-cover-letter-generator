# 🤖 AI Cover Letter Generator

A full-stack application that leverages generative AI to create unique, professional cover letters tailored to a specific job description based on a user's uploaded resume.

This project was built to showcase modern web development practices, including secure authentication, file processing, and integration with third-party AI services. It features a React frontend and a Node.js/Express backend.



***

## ✨ Features

- **Secure User Authentication**: Users can register and log in with secure, token-based (JWT) authentication.
- **Dynamic PDF Parsing**: Intelligently extracts text from uploaded PDF resumes using `pdfjs-dist`.
- **OCR Fallback**: If a PDF contains an image instead of text, the system converts the page to an image and uses Tesseract.js for Optical Character Recognition (OCR).
- **AI-Powered Content Generation**: Utilizes the Google Gemini API to generate a high-quality, plagiarism-free cover letter based on the user's resume and a target job description.
- **Markdown Rendering**: Displays the final cover letter with rich formatting (bold, lists, etc.) for a clean user experience.
- **Modern Frontend**: A responsive and intuitive user interface built with React, featuring global state management and protected routes.

***

## 🛠️ Tech Stack

### Frontend
- **React.js**: A modern JavaScript library for building user interfaces.
- **React Router**: For client-side routing and navigation.
- **Axios**: For making API requests to the backend.
- **React Context API**: For global state management (user authentication).
- **Vite**: As the frontend build tool and development server.

### Backend
- **Node.js & Express.js**: For building the robust and scalable server-side API.
- **MongoDB & Mongoose**: As the database for storing user credentials.
- **JSON Web Tokens (JWT)**: For implementing secure, token-based authentication.
- **Multer**: Middleware for handling `multipart/form-data`, used for file uploads.
- **pdfjs-dist & Tesseract.js**: For the advanced text extraction and OCR pipeline.
- **Google Gemini API**: The core generative AI for creating the cover letters.

***

## 🚀 Running the Project Locally

To set up and run this project on your own machine, follow these steps.

### Prerequisites
- Node.js (v18 or later recommended)
- npm (Node Package Manager)
- A MongoDB database (a free cloud instance from MongoDB Atlas is recommended)
- A Google Gemini API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/ai-cover-letter-generator.git](https://github.com/your-username/ai-cover-letter-generator.git)
    cd ai-cover-letter-generator
    ```

2.  **Set up the Backend:**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory and add the following variables:
    ```
    MONGO_URI="your_mongodb_connection_string"
    GEMINI_API_KEY="your_google_gemini_api_key"
    JWT_SECRET="your_strong_jwt_secret_key"
    ```

3.  **Set up the Frontend:**
    ```bash
    cd ../client
    npm install
    ```

### Starting the Application

1.  **Start the Backend Server:**
    In one terminal, navigate to the `server` directory and run:
    ```bash
    npm start
    ```
    The backend will be running on `http://localhost:3000`.

2.  **Start the Frontend Development Server:**
    In a separate terminal, navigate to the `client` directory and run:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` (or another port if 5173 is busy).

***
*After you deploy your project, remember to add a "Live Demo" link at the top of this file!*