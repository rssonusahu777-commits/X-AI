import { useState, useEffect } from "react";
import { api } from "../services/api";
import { UploadCloud, FileText, Database } from "lucide-react";

export default function Datasets() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatasets = async () => {
    try {
      const data = await api.get("/datasets");
      setDatasets(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      await api.upload("/upload-dataset", file);
      await fetchDatasets();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-900">Datasets</h2>
        <div>
          <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload CSV"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {datasets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Database className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>No datasets uploaded yet.</p>
            <p className="text-sm mt-1">Upload a CSV file to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {datasets.map((dataset) => (
              <li
                key={dataset.id}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">
                        {dataset.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {dataset.row_count} rows • {dataset.columns.length}{" "}
                        columns
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {dataset.columns.slice(0, 8).map((col: string) => (
                    <span
                      key={col}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800"
                    >
                      {col}
                    </span>
                  ))}
                  {dataset.columns.length > 8 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-500">
                      +{dataset.columns.length - 8} more
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
