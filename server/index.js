import "dotenv/config";
import cors from 'cors';
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
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { createCanvas } from "canvas"; // The new library for creating images

const app = express();
const port = 3000;

// --- INITIALIZATIONS & MIDDLEWARE ---
const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const corsOptions = {
    origin: process.env.FRONTEND_URL, // Use an env variable for your frontend URL
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- DATABASE & SERVER START ---
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
app.use("/api/auth", authRoutes);

app.post("/api/generate", authMiddleware, upload.single("resume"), async (req, res) => {
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
            resumeText += textContent.items.map(item => item.str).join(" ") + "\n";
        }

        // --- NEW OCR FALLBACK LOGIC ---
        if (!resumeText.trim()) {
            console.log("No text found, starting NEW OCR fallback...");
            const page = await pdfDoc.getPage(1); // Process the first page
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d");
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            // Convert canvas to a buffer Tesseract can read
            const imageBuffer = canvas.toBuffer("image/png");
            
            const { data: { text } } = await Tesseract.recognize(imageBuffer, "eng");
            resumeText = text;
        }

        const jobDescription = req.body.jobDescription || "";
        if (!resumeText.trim() || !jobDescription.trim()) {
            return res.status(400).send("Resume or job description is empty or unreadable.");
        }

        const prompt = `You are an expert career assistant...`; // Your prompt here
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
});