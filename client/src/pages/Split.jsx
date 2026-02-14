import React, { useState } from 'react';
import axios from 'axios';

export default function Split() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);

  const [splitMode, setSplitMode] = useState("range");
  // Initialize with Page 1 to Page 1
  const [ranges, setRanges] = useState([{ id: Date.now(), start: 1, end: 1 }]);
  const [isFused, setIsFused] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setThumbnails([]);
    setLoading(true);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const res = await axios.post('http://localhost:5000/get-all-thumbnails', formData);
      if (res.data.thumbnails && Array.isArray(res.data.thumbnails)) {
        setThumbnails(res.data.thumbnails);
      }
    } catch (err) {
      console.error("API Error:", err);
      alert("Could not load PDF previews.");
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async () => {
    // 1. FIXED: Removed 'rangeInput' check (it was undefined)
    if (!file) return alert("Please upload a file first!");

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    // 2. FIXED: Unified payload logic
    const payload = splitMode === 'all'
      ? thumbnails.map((_, i) => ({ start: i + 1, end: i + 1, fuse: false }))
      : ranges;

    // We only need to send 'split_config' as a stringified JSON
    formData.append('split_config', JSON.stringify(payload));
    formData.append('is_fused', isFused);

    try {
      const response = await axios.post('http://localhost:5000/split', formData, {
        responseType: 'blob',
      });

      if (response.data.size === 0) throw new Error("Server returned an empty file");

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentType = response.headers['content-type'];
      const extension = contentType === 'application/zip' ? 'zip' : 'pdf';

      link.setAttribute('download', `split_result.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Split failed:", err);
      alert("Split failed. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // 3. FIXED: Improved Add Range logic with auto-increment
  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newStart = lastRange ? lastRange.end + 1 : 1;

    if (newStart > thumbnails.length) {
      alert("No more pages available!");
      return;
    }

    const newEnd = Math.min(newStart, thumbnails.length);

    setRanges([...ranges, {
      id: Date.now(),
      start: newStart,
      end: newEnd,
      fuse: false
    }]);
  };

  // Logic for filtering previews
  const activePages = new Set();
  ranges.forEach(r => {
    for (let i = r.start; i <= r.end; i++) {
      activePages.add(i);
    }
  });

  const shouldFilter = splitMode === 'range' && ranges.length > 0;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Split <span className="text-blue-600">PDF</span></h1>
        <p className="text-gray-600">Smart range extraction with visual preview.</p>
      </div>

      {!file ? (
        <div className="max-w-md mx-auto bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors text-center relative group">
          <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">✂️</div>
          <p className="font-bold text-gray-700">Choose a PDF to Split</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Preview Gallery */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">Live Preview</h3>
            {loading && thumbnails.length === 0 ? (
              <div className="animate-pulse flex space-x-4">Scanning...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-gray-50 overflow-y-auto max-h-175">
                {thumbnails.map((thumb, idx) => {
                  const pageNum = idx + 1;

                  // Find if this page belongs to a range
                  const rangeIndex = ranges.findIndex(r => pageNum >= r.start && pageNum <= r.end);
                  const inRange = rangeIndex !== -1;

                  return (
                    <div
                      key={idx}
                      className={`relative p-2 rounded-lg transition-all duration-300 ${inRange
                        ? 'border-2 border-dashed border-blue-500 bg-blue-50/30 scale-105 z-10'
                        : 'opacity-40 grayscale-50'
                        }`}
                    >
                      {/* Range Label Badge */}
                      {inRange && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          RANGE {rangeIndex + 1}
                        </div>
                      )}

                      <img src={thumb} className="w-full h-auto rounded shadow-sm" alt={`Page ${pageNum}`} />

                      <div className={`absolute top-3 left-3 text-[10px] font-bold px-1.5 rounded ${inRange ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
                        }`}>
                        {pageNum}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button onClick={() => setSplitMode("range")} className={`flex-1 py-2 text-xs font-bold rounded-md ${splitMode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Ranges</button>
              <button onClick={() => setSplitMode("all")} className={`flex-1 py-2 text-xs font-bold rounded-md ${splitMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Split All</button>
            </div>

            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-sm font-medium text-gray-500">
                Total Pages: <span className="text-gray-900 font-bold">{thumbnails.length}</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="text-sm font-medium text-gray-500">
                Selected: <span className="text-blue-600 font-bold">{activePages.size}</span>
              </div>
            </div>

            {splitMode === "range" && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ranges</span>
                  <button onClick={addRange} className="text-xs font-bold text-blue-600 hover:underline">+ Add Range</button>
                </div>

                {ranges.map((range, index) => (
                  <div key={range.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-600">RANGE {index + 1}</span>
                      {ranges.length > 1 && (
                        <button onClick={() => setRanges(ranges.filter(r => r.id !== range.id))} className="text-red-400 text-[10px]">Remove</button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">From:</label>
                        <input
                          type="number"
                          min="1"
                          max={thumbnails.length}
                          value={range.start}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 1;
                            const newRanges = [...ranges];
                            // Ensure it doesn't start before the previous range ends
                            const prevRange = ranges[index - 1];
                            if (prevRange && val <= prevRange.end) val = prevRange.end + 1;

                            newRanges[index].start = Math.min(val, thumbnails.length);
                            // Auto-adjust 'end' if it's now less than 'start'
                            if (newRanges[index].end < newRanges[index].start) newRanges[index].end = newRanges[index].start;
                            setRanges(newRanges);
                          }}
                          className="..."
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">To:</label>
                        <input
                          type="number"
                          min={range.start}
                          max={thumbnails.length}
                          value={range.end}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 1;
                            const newRanges = [...ranges];
                            // Cap at document length
                            newRanges[index].end = Math.min(val, thumbnails.length);
                            setRanges(newRanges);
                          }}
                          className="..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Global Fuse Checkbox */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFused}
                      onChange={(e) => setIsFused(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-blue-800 block">Fuse all ranges?</span>
                      <span className="text-[10px] text-blue-600">Merge your selected ranges into a single PDF file</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={handleSplit}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Download Split Results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}