import React, { useState } from 'react';

const GradeConverter: React.FC = () => {
  const [nMax, setNMax] = useState<number | "">("");
  const [nMin, setNMin] = useState<number | "">("");
  const [nYour, setNYour] = useState<number | "">("");
  const [germanGrade, setGermanGrade] = useState<number | null>(null);

  const calculateGrade = () => {
    if (nMax !== "" && nMin !== "" && nYour !== "") {
      const grade = 1 + (3 * (nMax - nYour)) / (nMax - nMin);
      setGermanGrade(parseFloat(grade.toFixed(2)));
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">German Grade Converter</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Maximum Grade (Nmax)</label>
          <input
            type="number"
            value={nMax}
            onChange={(e) => setNMax(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Minimum Passing Grade (Nmin)</label>
          <input
            type="number"
            value={nMin}
            onChange={(e) => setNMin(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Your Grade (Nyour)</label>
          <input
            type="number"
            value={nYour}
            onChange={(e) => setNYour(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={calculateGrade}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Calculate German Grade
        </button>
        {germanGrade !== null && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
            <p>Your German Grade: <strong>{germanGrade}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeConverter;