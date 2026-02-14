import React, { useState } from 'react';
import axios from 'axios';

export default function Split() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);

  const [splitMode, setSplitMode] = useState("range");
  const [ranges, setRanges] = useState([{ id: Date.now(), start: 1, end: 1 }]);
  const [isFused, setIsFused] = useState(false);

  const RANGE_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-600', shadow: 'shadow-blue-100', input: 'focus:border-blue-500' },
    { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', badge: 'bg-rose-600', shadow: 'shadow-rose-100', input: 'focus:border-rose-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-600', shadow: 'shadow-emerald-100', input: 'focus:border-emerald-500' },
    { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', badge: 'bg-amber-600', shadow: 'shadow-amber-100', input: 'focus:border-amber-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-600', shadow: 'shadow-indigo-100', input: 'focus:border-indigo-500' },
  ];

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
    if (!file) return alert("Please upload a file first!");
    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    const payload = splitMode === 'all'
      ? thumbnails.map((_, i) => ({ start: i + 1, end: i + 1, fuse: false }))
      : ranges;
    formData.append('split_config', JSON.stringify(payload));
    formData.append('is_fused', isFused);
    try {
      const response = await axios.post('http://localhost:5000/split', formData, { responseType: 'blob' });
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
      alert("Split failed. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newStart = lastRange ? lastRange.end + 1 : 1;
    if (newStart > thumbnails.length) return alert("No more pages available.");
    setRanges([...ranges, { id: Date.now(), start: newStart, end: Math.min(newStart, thumbnails.length) }]);
  };

  const activePages = new Set();
  ranges.forEach(r => {
    if (typeof r.start === 'number' && typeof r.end === 'number') {
      for (let i = r.start; i <= r.end; i++) activePages.add(i);
    }
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Split <span className="text-blue-600">PDF</span></h1>
        <p className="text-gray-600">Smart range extraction with visual preview.</p>
      </div>

      {!file ? (
        <div className="max-w-md mx-auto bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 text-center relative group">
          <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="text-4xl mb-3">✂️</div>
          <p className="font-bold text-gray-700">Choose a PDF to Split</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">Live Preview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-4 border rounded-lg bg-gray-50 overflow-y-auto max-h-175">
              {thumbnails.map((thumb, idx) => {
                const pageNum = idx + 1;
                const rangeIndex = ranges.findIndex(r => pageNum >= r.start && pageNum <= r.end);
                const inRange = rangeIndex !== -1;
                const color = inRange ? RANGE_COLORS[rangeIndex % RANGE_COLORS.length] : null;
                return (
                  <div key={idx} className={`relative p-2 rounded-xl transition-all duration-300 ${inRange ? `border-2 border-dashed ${color.border} ${color.bg} scale-105 z-10 shadow-md` : 'opacity-30 grayscale'}`}>
                    {inRange && <div className={`absolute -top-2 -right-2 ${color.badge} text-white text-[9px] font-black px-2 py-0.5 rounded-full`}>R{rangeIndex + 1}</div>}
                    <img src={thumb} className="w-full h-auto rounded-lg" alt={`Page ${pageNum}`} />
                    <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded ${inRange ? color.badge + ' text-white' : 'bg-gray-400 text-white'}`}>{pageNum}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24 w-full lg:max-w-xs">
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button onClick={() => setSplitMode("range")} className={`flex-1 py-2 text-xs font-bold rounded-md ${splitMode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Ranges</button>
              <button onClick={() => setSplitMode("all")} className={`flex-1 py-2 text-xs font-bold rounded-md ${splitMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Split All</button>
            </div>

            {splitMode === "range" && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Config</span>
                  <button onClick={addRange} className="text-xs font-bold text-blue-600 hover:underline">+ Add Range</button>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Total: <span className="text-gray-900">{thumbnails.length}</span></div>
                  <div className="h-3 w-px bg-gray-300"></div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Selected: <span className="text-blue-600">{activePages.size}</span></div>
                </div>

                {ranges.map((range, index) => {
                  const color = RANGE_COLORS[index % RANGE_COLORS.length];
                  return (
                    <div key={range.id} className={`p-4 rounded-xl border-2 shadow-sm transition-all ${color.bg} ${color.border} ${color.shadow} max-w-[320px] mx-auto`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${color.text}`}>Range {index + 1}</span>
                        {ranges.length > 1 && (
                          <button onClick={() => setRanges(ranges.filter(r => r.id !== range.id))} className="text-gray-400 hover:text-red-500">✕</button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block ml-1">From</label>
                          <input
                            type="number"
                            min={index > 0 ? ranges[index - 1].end + 1 : 1}
                            value={range.start}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                            }}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const newRanges = [...ranges];
                              if (valStr === '') {
                                newRanges[index].start = '';
                              } else {
                                let val = parseInt(valStr);
                                const minAllowed = index > 0 ? ranges[index - 1].end + 1 : 1;
                                // Real-time floor check
                                if (val < minAllowed) val = minAllowed;
                                newRanges[index].start = val;
                              }
                              setRanges(newRanges);
                            }}
                            onBlur={() => {
                              const newRanges = [...ranges];
                              let val = parseInt(newRanges[index].start);
                              const minAllowed = index > 0 ? ranges[index - 1].end + 1 : 1;

                              if (isNaN(val) || val < minAllowed) val = minAllowed;
                              if (val > thumbnails.length) val = thumbnails.length;

                              newRanges[index].start = val;
                              // Ensure "To" is never less than "From"
                              if (newRanges[index].end < val) newRanges[index].end = val;
                              setRanges(newRanges);
                            }}
                            className={`w-full p-2 text-sm border-2 rounded-lg bg-white text-gray-900 font-bold outline-none transition-all ${color.input}`}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block ml-1">To</label>
                          <input
                            type="number"
                            min={range.start || 1}
                            max={thumbnails.length}
                            value={range.end}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                            }}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const newRanges = [...ranges];
                              if (valStr === '') {
                                newRanges[index].end = '';
                              } else {
                                let val = parseInt(valStr);
                                // "To" cannot be less than "From"
                                if (val < newRanges[index].start) val = newRanges[index].start;
                                newRanges[index].end = val;
                              }
                              setRanges(newRanges);
                            }}
                            onBlur={() => {
                              const newRanges = [...ranges];
                              let val = parseInt(newRanges[index].end);

                              if (isNaN(val) || val < newRanges[index].start) val = newRanges[index].start;
                              if (val > thumbnails.length) val = thumbnails.length;

                              newRanges[index].end = val;
                              setRanges(newRanges);
                            }}
                            className={`w-full p-2 text-sm border-2 rounded-lg bg-white text-gray-900 font-bold outline-none transition-all ${color.input}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isFused} onChange={(e) => setIsFused(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-blue-800 block">Fuse all ranges?</span>
                      <span className="text-[10px] text-blue-600 leading-tight block">Merge selected into one PDF</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <button onClick={handleSplit} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold disabled:bg-gray-400 mt-2">
              {loading ? "Processing..." : "Download Result"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}