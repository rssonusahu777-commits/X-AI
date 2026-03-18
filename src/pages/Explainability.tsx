import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Lightbulb, BarChart3, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

export default function Explainability() {
  const [models, setModels] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedPredictionId, setSelectedPredictionId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
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
    fetchData();
  }, []);

  const selectedModel = models.find((m) => m.id === Number(selectedModelId));
  const selectedPrediction = predictions.find(
    (p) => p.id === Number(selectedPredictionId),
  );

  const filteredPredictions = predictions.filter(
    (p) => p.model_id === Number(selectedModelId),
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-900">
          Explainability
        </h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => {
                setSelectedModelId(e.target.value);
                setSelectedPredictionId("");
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Prediction (Optional)
              </label>
              <select
                value={selectedPredictionId}
                onChange={(e) => setSelectedPredictionId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Global Feature Importance</option>
                {filteredPredictions.map((p) => (
                  <option key={p.id} value={p.id}>
                    Prediction #{p.id} - {p.prediction_result} (
                    {new Date(p.created_at).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {!selectedModel ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
          <Lightbulb className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p>Select a model to view its explainability metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Global Feature Importance */}
          {!selectedPredictionId && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Global Feature Importance
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                This chart shows which features overall have the most impact on
                the model's predictions.
              </p>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedModel.feature_importance}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        (value * 100).toFixed(2) + "%",
                        "Importance",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="importance"
                      fill="#4f46e5"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Local SHAP Values */}
          {selectedPrediction && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
                Local Explanation (SHAP Values)
              </h3>
              <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-900">
                  <strong>Prediction:</strong>{" "}
                  {selectedPrediction.prediction_result}
                </p>
                <p className="text-sm text-indigo-700 mt-1">
                  This chart shows how each feature contributed to this specific
                  prediction. Positive values push the prediction towards one
                  class, negative towards the other.
                </p>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedPrediction.shap_values.sort(
                      (a: any, b: any) => Math.abs(b.value) - Math.abs(a.value),
                    )}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toFixed(4),
                        "SHAP Value",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {selectedPrediction.shap_values.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.value >= 0 ? "#10b981" : "#ef4444"}
                          />
                        ),
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
