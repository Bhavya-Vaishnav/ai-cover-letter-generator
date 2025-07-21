import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import express from "express";
import multer from "multer";
import { unlink } from "fs";
import { readFileSync, promises as fsPromises } from "fs";

// --- All Core Imports ---
import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";
import authMiddleware from "./middleware/authMiddleware.js";
import authRoutes from "./routes/auth.js";

// --- PDF & Image Processing Libraries ---
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { createCanvas } from "canvas"; // The new library for creating images

const app = express();
const port = 3000;

// --- INITIALIZATIONS & MIDDLEWARE ---
const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// In server/index.js

// Add this debug middleware
app.use((req, res, next) => {
  console.log("Incoming Request Origin:", req.headers.origin);
  next();
});

// ...
// A list of all frontend URLs that are allowed to make requests to our backend
const allowedOrigins = [
  process.env.FRONTEND_URL, // Your deployed Vercel URL
  "http://localhost:5173", // Your local development server
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- DATABASE & SERVER START ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
    app.listen(port, () => {
      console.log(`✅ Server is listening on port ${port}.`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- ROUTES ---
app.use("/api/auth", authRoutes);

app.post(
  "/api/generate",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const filePath = req.file.path;
    let resumeText = "";

    try {
      const dataBuffer = readFileSync(filePath);
      const uint8array = new Uint8Array(dataBuffer);
      const pdfDoc = await pdfjsLib.getDocument(uint8array).promise;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        resumeText +=
          textContent.items.map((item) => item.str).join(" ") + "\n";
      }

      // --- NEW OCR FALLBACK LOGIC ---
      if (!resumeText.trim()) {
        console.log("No text found, starting NEW OCR fallback...");
        const page = await pdfDoc.getPage(1); // Process the first page
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext("2d");

        await page.render({ canvasContext: context, viewport: viewport })
          .promise;

        // Convert canvas to a buffer Tesseract can read
        const imageBuffer = canvas.toBuffer("image/png");

        const {
          data: { text },
        } = await Tesseract.recognize(imageBuffer, "eng");
        resumeText = text;
      }

      const jobDescription = req.body.jobDescription || "";
      if (!resumeText.trim() || !jobDescription.trim()) {
        return res
          .status(400)
          .send("Resume or job description is empty or unreadable.");
      }

      const prompt = `You are an expert career assistant and professional writer. Your task is to write a compelling, unique, and professional cover letter based on the provided resume and job description.

**Instructions:**
1.  **Analyze and Synthesize:** Do not simply copy sentences. Read and understand both the resume and the job description. Synthesize the information to show how the candidate's skills and experience directly align with the job's requirements.
2.  **Use a Professional Tone:** The tone should be enthusiastic, confident, and professional.
3.  **Paraphrase Everything:** All content must be in your own words. Paraphrase the skills from the resume and the requirements from the job description. Avoid plagiarism.
4.  **Structure:** Create a well-structured cover letter with an introduction, a body that highlights key qualifications with specific examples, and a strong concluding paragraph with a call to action.
5.  **Format:** Use Markdown for clear formatting (e.g., bolding for emphasis, paragraphs).

---

**[Resume Information]**
${resumeText}

---

**[Job Description]**
${jobDescription}

---

**[Generated Cover Letter]**`;
      const result = await model.generateContent(prompt);
      const coverLetter = result.response.text();

      console.log("✅ Cover Letter Generated Successfully!");
      res.json({ coverLetter });
    } catch (e) {
      console.error("❌ An error occurred during the generate process:", e);
      res.status(500).send("An error occurred while processing your request.");
    } finally {
      unlink(filePath, () => {});
    }
  }
);
