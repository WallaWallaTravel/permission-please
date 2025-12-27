'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react';

interface School {
  id: string;
  name: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  studentName?: string;
  parentEmail?: string;
  error?: string;
}

interface ParsedRow {
  name: string;
  grade: string;
  parentName: string;
  parentEmail: string;
  relationship: string;
}

export default function ImportPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const response = await fetch('/api/admin/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools);
      }
    } catch {
      console.error('Failed to fetch schools');
    } finally {
      setIsLoading(false);
    }
  }

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header (first line)
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Map common header variations
    const headerMap: Record<string, keyof ParsedRow> = {
      'student name': 'name',
      student: 'name',
      name: 'name',
      grade: 'grade',
      class: 'grade',
      year: 'grade',
      'parent name': 'parentName',
      parent: 'parentName',
      'guardian name': 'parentName',
      guardian: 'parentName',
      'parent email': 'parentEmail',
      email: 'parentEmail',
      'guardian email': 'parentEmail',
      relationship: 'relationship',
      relation: 'relationship',
    };

    // Find column indices
    const columnIndices: Partial<Record<keyof ParsedRow, number>> = {};
    headers.forEach((header, index) => {
      const mappedKey = headerMap[header];
      if (mappedKey) {
        columnIndices[mappedKey] = index;
      }
    });

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted values with commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: ParsedRow = {
        name: columnIndices.name !== undefined ? values[columnIndices.name] || '' : '',
        grade: columnIndices.grade !== undefined ? values[columnIndices.grade] || '' : '',
        parentName:
          columnIndices.parentName !== undefined ? values[columnIndices.parentName] || '' : '',
        parentEmail:
          columnIndices.parentEmail !== undefined ? values[columnIndices.parentEmail] || '' : '',
        relationship:
          columnIndices.relationship !== undefined
            ? values[columnIndices.relationship] || 'Parent'
            : 'Parent',
      };

      if (row.name || row.parentEmail) {
        rows.push(row);
      }
    }

    return rows;
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      if (data.length === 0) {
        setError('No valid data found in CSV. Please check the file format.');
        return;
      }
      setParsedData(data);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData,
          schoolId: selectedSchool || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Import failed');
        return;
      }

      setImportResults(data.results);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsImporting(false);
    }
  }

  function downloadTemplate() {
    const template =
      'Student Name,Grade,Parent Name,Parent Email,Relationship\nJohn Smith,5th Grade,Jane Smith,jane.smith@email.com,Mother\nEmily Johnson,3rd Grade,Bob Johnson,bob.johnson@email.com,Father';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetImport() {
    setParsedData([]);
    setImportResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Import</h1>
        <p className="text-slate-600">Import students and parents from a CSV file</p>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-3 font-semibold text-blue-900">How to import</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-blue-800">
          <li>Download the template CSV file below</li>
          <li>Fill in the student and parent information</li>
          <li>Upload the completed CSV file</li>
          <li>Review the data and click Import</li>
        </ol>
        <button
          onClick={downloadTemplate}
          className="mt-4 flex items-center gap-2 font-medium text-blue-700 hover:text-blue-900"
        >
          <Download className="h-4 w-4" />
          Download Template CSV
        </button>
      </div>

      {/* School Selection */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Assign to School (Optional)
        </label>
        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No specific school</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      {!importResults && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Upload CSV File</h2>

          {parsedData.length === 0 ? (
            <div
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-12 text-center transition-colors hover:border-blue-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600">Click to upload or drag and drop</p>
              <p className="mt-1 text-sm text-slate-400">CSV files only</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{parsedData.length} rows ready to import</span>
                </div>
                <button
                  onClick={resetImport}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>

              {/* Preview Table */}
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="max-h-64 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Student</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Grade</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Parent</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Email</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">
                          Relationship
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{row.name}</td>
                          <td className="px-4 py-2">{row.grade}</td>
                          <td className="px-4 py-2">{row.parentName}</td>
                          <td className="px-4 py-2">{row.parentEmail}</td>
                          <td className="px-4 py-2">{row.relationship}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="bg-slate-50 px-4 py-2 text-sm text-slate-500">
                    ... and {parsedData.length - 10} more rows
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  <XCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {parsedData.length} Records
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Import Results</h2>
            <button onClick={resetImport} className="text-sm text-blue-600 hover:text-blue-800">
              Import More
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">
                  {importResults.filter((r) => r.success).length}
                </span>
              </div>
              <p className="mt-1 text-sm text-green-600">Successful imports</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">
                  {importResults.filter((r) => !r.success).length}
                </span>
              </div>
              <p className="mt-1 text-sm text-red-600">Failed imports</p>
            </div>
          </div>

          {/* Note about default password */}
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Default Password Set</p>
              <p className="text-sm text-amber-700">
                New parent accounts were created with the default password:{' '}
                <code className="rounded bg-amber-100 px-1">Welcome123!</code>
              </p>
              <p className="text-sm text-amber-700">Parents should change this on first login.</p>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="max-h-96 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Row</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Student</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Parent Email</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResults.map((result) => (
                    <tr key={result.row} className={result.success ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2">{result.row}</td>
                      <td className="px-4 py-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </td>
                      <td className="px-4 py-2">{result.studentName || '-'}</td>
                      <td className="px-4 py-2">{result.parentEmail || '-'}</td>
                      <td className="px-4 py-2">
                        {result.success ? (
                          <span className="text-green-600">Imported successfully</span>
                        ) : (
                          <span className="text-red-600">{result.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
