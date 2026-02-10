import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: window.crypto.randomUUID(), // Faster, safer ID
      file: file,
      preview: URL.createObjectURL(file),
      rotation: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleMerge = async () => {

    if (files.length < 2) return alert("Select at least 2 PDFs!");
    const formData = new FormData();

    // Add files
    files.forEach((fileObj) => {
      formData.append('pdfs', fileObj.file);
    });

    const rotationData = files.map(f => f.rotation || 0);
    formData.append('rotations', JSON.stringify(rotationData));

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/merge', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Something went wrong during merging.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    // Get files from the event
    const droppedFiles = [...e.dataTransfer.files];

    // Filter for PDFs only
    const pdfs = droppedFiles.filter(file => file.type === "application/pdf");

    if (pdfs.length > 0) {
      setFiles((prev) => [...prev, ...pdfs]);
    } else {
      alert("Please drop PDF files only!");
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const rotateFile = (id) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f
    ));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= newFiles.length) return;
    [newFiles[index], newFiles[nextIndex]] = [newFiles[nextIndex], newFiles[index]];
    setFiles(newFiles);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Merge <span className="text-red-600">PDF</span>
        </h1>
        <p className="text-gray-600">Combine multiple PDF files into one in seconds.</p>
      </div>

      {/* Upload Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer 
    ${isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-red-400'}`}
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer text-center">
            <div className="text-4xl mb-2">📄</div>
            <span className="text-sm font-medium text-gray-700">Click to upload or drag and drop</span>
            <p className="text-xs text-gray-500 mt-1">PDF files only</p>
          </label>
        </div>

        {/* File List Area */}
        {files.length > 0 && (
          <div className="mt-6 w-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Selected Files ({files.length}):</h3>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-red-500 hover:underline font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {files.map((fileObj, idx) => (
                <div key={fileObj.id} className="relative bg-white border rounded-lg p-2 shadow-sm">
                  {/* Note #1: Preview */}
                  <div className="h-32 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    <embed
                      loading="lazy"
                      src={fileObj.preview}
                      className="w-full h-full pointer-events-none"
                      style={{ transform: `rotate(${fileObj.rotation}deg)` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[10px] truncate w-20">{fileObj.file.name}</span>

                    <div className="flex gap-1">
                      {/* Rotation Button */}
                      <button onClick={() => rotateFile(fileObj.id)} className="p-1 hover:bg-gray-100 rounded text-xs">🔄</button>
                      {/* Move Buttons */}
                      <button onClick={() => moveFile(idx, -1)} className="p-1 hover:bg-gray-100 rounded text-xs">⬅️</button>
                      <button onClick={() => moveFile(idx, 1)} className="p-1 hover:bg-gray-100 rounded text-xs">➡️</button>
                      {/* Remove */}
                      <button onClick={() => removeFile(fileObj.id)} className="p-1 hover:text-red-500 text-xs">❌</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleMerge}
          disabled={loading || files.length < 2}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md
            ${loading || files.length < 2
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 active:transform active:scale-95'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
              Merging...
            </span>
          ) : "Merge PDF"}
        </button>
      </div>

      <footer className="mt-auto text-gray-400 text-sm">
        Built with Node.js + Python
      </footer>
    </div>
  );
}

export default App;