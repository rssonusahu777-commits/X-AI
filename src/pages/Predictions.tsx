import { useState, useEffect } from "react";
import { api } from "../services/api";
import { LineChart, Play, AlertCircle } from "lucide-react";

export default function Predictions() {
  const [models, setModels] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [modelsData, predictionsData] = await Promise.all([
        api.get("/models"),
        api.get("/predictions"),
      ]);
      setModels(modelsData);
      setPredictions(predictionsData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedModel = models.find((m) => m.id === Number(selectedModelId));

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    setPredicting(true);
    setError("");
    try {
      // Convert inputs to numbers where possible
      const processedInput = Object.fromEntries(
        Object.entries(inputData).map(([k, v]) => [
          k,
          isNaN(Number(v)) ? v : Number(v),
        ]),
      );

      await api.post("/predict", {
        modelId: selectedModel.id,
        inputData: processedInput,
      });
      await fetchData();
      setInputData({});
    } catch (err: any) {
      setError(err.message || "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-900">Predictions</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-indigo-600" />
              New Prediction
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Model
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setInputData({});
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Choose a trained model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedModel && (
              <form onSubmit={handlePredict} className="space-y-4">
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-900 mb-4">
                    Input Features
                  </h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {selectedModel.dataset_columns
                      .filter((c: string) => c !== selectedModel.target_column)
                      .map((col: string) => (
                        <div key={col}>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {col}
                          </label>
                          <input
                            type="text"
                            required
                            value={inputData[col] || ""}
                            onChange={(e) =>
                              setInputData({
                                ...inputData,
                                [col]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder={`Enter ${col}`}
                          />
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={predicting}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                >
                  {predicting ? (
                    "Predicting..."
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Generate Prediction
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {predictions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <LineChart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>No predictions made yet.</p>
                <p className="text-sm mt-1">
                  Select a model and input data to generate one.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {predictions.map((pred) => (
                  <li
                    key={pred.id}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">
                          Model:{" "}
                          <span className="text-slate-900">
                            {pred.model_name}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(pred.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Result ({pred.target_column})
                        </div>
                        <div className="text-xl font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">
                          {pred.prediction_result}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Input Data
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(pred.input_data).map(([key, value]) => (
                          <div
                            key={key}
                            className="inline-flex items-center bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs"
                          >
                            <span className="text-slate-500 mr-1.5">
                              {key}:
                            </span>
                            <span className="font-medium text-slate-900">
                              {String(value)}
                            </span>
                          </div>
                        ))}
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
