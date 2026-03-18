import { useState, useEffect } from "react";
import { api } from "../services/api";
import { BrainCircuit, Play, CheckCircle2 } from "lucide-react";

export default function Models() {
  const [models, setModels] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    datasetId: "",
    algorithm: "Random Forest",
    targetColumn: "",
  });

  const fetchModels = async () => {
    try {
      const [modelsData, datasetsData] = await Promise.all([
        api.get("/models"),
        api.get("/datasets"),
      ]);
      setModels(modelsData);
      setDatasets(datasetsData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setError("");
    try {
      await api.post("/train-model", formData);
      await fetchModels();
      setFormData({
        name: "",
        datasetId: "",
        algorithm: "Random Forest",
        targetColumn: "",
      });
    } catch (err: any) {
      setError(err.message || "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const selectedDataset = datasets.find(
    (d) => d.id === Number(formData.datasetId),
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-900">Models</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              Train New Model
            </h3>
            <form onSubmit={handleTrain} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Customer Churn Predictor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dataset
                </label>
                <select
                  required
                  value={formData.datasetId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      datasetId: e.target.value,
                      targetColumn: "",
                    })
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a dataset</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDataset && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Column
                  </label>
                  <select
                    required
                    value={formData.targetColumn}
                    onChange={(e) =>
                      setFormData({ ...formData, targetColumn: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select target to predict</option>
                    {selectedDataset.columns.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Algorithm
                </label>
                <select
                  required
                  value={formData.algorithm}
                  onChange={(e) =>
                    setFormData({ ...formData, algorithm: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Random Forest">Random Forest</option>
                  <option value="Decision Tree">Decision Tree</option>
                  <option value="Logistic Regression">
                    Logistic Regression
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={
                  training || !formData.datasetId || !formData.targetColumn
                }
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
              >
                {training ? (
                  "Training Model..."
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Training
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {models.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <BrainCircuit className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>No models trained yet.</p>
                <p className="text-sm mt-1">
                  Use the form to train your first model.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {models.map((model) => (
                  <li
                    key={model.id}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                          {model.name}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {model.status}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {model.algorithm} • Target:{" "}
                          <span className="font-medium text-slate-700">
                            {model.target_column}
                          </span>
                        </p>
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(model.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                          Accuracy
                        </div>
                        <div className="mt-1 text-lg font-medium text-slate-900">
                          {(model.metrics.accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                          Precision
                        </div>
                        <div className="mt-1 text-lg font-medium text-slate-900">
                          {(model.metrics.precision * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                          Recall
                        </div>
                        <div className="mt-1 text-lg font-medium text-slate-900">
                          {(model.metrics.recall * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                          F1 Score
                        </div>
                        <div className="mt-1 text-lg font-medium text-slate-900">
                          {(model.metrics.f1Score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
