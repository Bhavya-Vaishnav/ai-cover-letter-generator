import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown"; // Import the markdown renderer

function Generator() {
  // State for the form inputs
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  // State to manage the API call and response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  const { token, logout } = useAuth(); // Get token and logout function from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setError("Please upload a resume file.");
      return;
    }

    setLoading(true);
    setError("");
    setCoverLetter("");

    // Use FormData to send both a file and text
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);

    try {
      const response = await axios.post("${import.meta.env.VITE_API_URL}/api/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // Attach the auth token
        },
      });
      setCoverLetter(response.data.coverLetter);
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message ||
          "An error occurred while generating the cover letter."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generator-container">
      <header className="generator-header">
        <h1>AI Cover Letter Generator</h1>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>

      <div className="generator-body">
        <div className="generator-form-section">
          <h3>Your Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="job-description">Job Description</label>
              <textarea
                id="job-description"
                rows="12"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="resume">Upload Resume (PDF)</label>
              <input
                type="file"
                id="resume"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files[0])}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Cover Letter"}
            </button>
          </form>
        </div>

        <div className="generator-output-section">
          <h3>Your Cover Letter</h3>
          <div className="output-area">
            {loading && (
              <p className="loading-message">
                Writing your cover letter, please wait...
              </p>
            )}
            {error && <p className="error-message">{error}</p>}
            {coverLetter && (
              <div className="prose">
                <ReactMarkdown>{coverLetter}</ReactMarkdown>
              </div>
            )}
            {!loading && !error && !coverLetter && (
              <p className="placeholder-text">
                Your generated cover letter will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Generator;
