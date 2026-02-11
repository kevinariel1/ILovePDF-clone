import React, { useState } from 'react';
import axios from 'axios';

export default function Split() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]); // Array of all page images
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Reset states for the new file
    setFile(selectedFile);
    setThumbnails([]);
    setLoading(true);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const res = await axios.post('http://localhost:5000/get-all-thumbnails', formData);
      // Check if the response actually has thumbnails
      if (res.data.thumbnails && Array.isArray(res.data.thumbnails)) {
        setThumbnails(res.data.thumbnails);
      }
    } catch (err) {
      console.error("API Error:", err);
      alert("Could not load PDF previews. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Split <span className="text-blue-600">PDF</span></h1>
        <p className="text-gray-600">Select ranges or extract all pages into separate files.</p>
      </div>

      {!file ? (
        <div className="max-w-md mx-auto bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors text-center relative group">
          <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">✂️</div>
          <p className="font-bold text-gray-700">Choose a PDF to Split</p>
          <p className="text-xs text-gray-400 mt-2">Single file only</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Preview Gallery */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-700">Page Preview</h3>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-500 animate-pulse">Scanning pages and generating previews...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-150 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {thumbnails.map((thumb, idx) => (
                  <div key={idx} className="relative bg-white p-1 rounded border shadow-sm hover:ring-2 hover:ring-blue-400 transition-all">
                    <img src={thumb} className="w-full h-auto" alt={`Page ${idx + 1}`} />
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 rounded-sm shadow-sm">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Split Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h3 className="font-bold mb-4 text-gray-700">Split Configuration</h3>

            <div className="space-y-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                Found <strong>{thumbnails.length}</strong> pages in this document.
              </div>

              {/* We will build the "Range" logic here next */}
              <div className="text-xs text-gray-400 italic">
                Select "Split All" to save every page as a separate PDF.
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all">
              Download Split Results
            </button>

            <button
              onClick={() => { setFile(null); setThumbnails([]); }}
              className="w-full mt-4 text-gray-400 text-sm hover:text-red-500 transition-colors"
            >
              ← Choose a different file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}