import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import multer from "multer";
import { unlink } from "fs";
import { readFileSync, promises as fsPromises } from "fs";
import { dirname, basename } from "path";

// --- All Imports Re-enabled ---
import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";
import { convert } from "pdf-poppler";
import authMiddleware from "./middleware/authMiddleware.js";
import authRoutes from "./routes/auth.js"; 
// The new, reliable PDF library
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";


const app = express();
const port = 3000;

// --- INITIALIZATIONS ---
const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- MIDDLEWARE & DATABASE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
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

// 👇 2. ADD THIS LINE TO ACTIVATE YOUR LOGIN/REGISTER ROUTES
app.use("/api/auth", authRoutes);

// THE FINAL /generate ROUTE
app.post("/api/generate", authMiddleware, upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = req.file.path;
  let resumeText = "";

  try {
    // --- Text Extraction using pdfjs-dist ---
    const dataBuffer = readFileSync(filePath);
    const uint8array = new Uint8Array(dataBuffer);
    const pdfDoc = await pdfjsLib.getDocument(uint8array).promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    // --- OCR Fallback Logic ---
    if (!resumeText.trim()) {
      console.log("No text found, starting OCR fallback...");
      const opts = {
        format: "png",
        out_dir: dirname(filePath),
        out_prefix: basename(filePath, ".pdf"),
        page: 1,
      };
      await convert(filePath, opts);
      const imagePath = `${opts.out_dir}/${opts.out_prefix}-1.png`;
      const { data: { text } } = await Tesseract.recognize(imagePath, "eng");
      resumeText = text;
      await fsPromises.unlink(imagePath); // Clean up the image
    }

    const jobDescription = req.body.jobDescription || "";
    if (!resumeText.trim() || !jobDescription.trim()) {
      return res.status(400).send("Resume or job description is empty or unreadable.");
    }

    // --- AI Prompt and Generation ---
    const prompt = `You are an expert career assistant. Based on the resume and job description below, write a professional and enthusiastic cover letter. Do not copy sentences; paraphrase and summarize to show how the candidate's skills align with the job. Format the output in Markdown.

Resume:
${resumeText}

Job Description:
${jobDescription}

Cover Letter:`;

    const result = await model.generateContent(prompt);
    const coverLetter = result.response.text();
    
    console.log("✅ Cover Letter Generated Successfully!");
    res.json({ coverLetter });

  } catch (e) {
    console.error("❌ An error occurred during the generate process:", e);
    res.status(500).send("An error occurred while processing your request.");
  } finally {
    // Always clean up the uploaded PDF
    unlink(filePath, () => {});
  }
});