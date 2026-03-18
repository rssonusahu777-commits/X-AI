import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Database, BrainCircuit, LineChart } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    datasets: 0,
    models: 0,
    predictions: 0,
  });

  useEffect(() => {
    api.get("/dashboard-stats").then(setStats).catch(console.error);
  }, []);

  const cards = [
    {
      name: "Total Datasets",
      value: stats.datasets,
      icon: Database,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "Trained Models",
      value: stats.models,
      icon: BrainCircuit,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      name: "Predictions Made",
      value: stats.predictions,
      icon: LineChart,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-white overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-xl p-3 ${card.bg}`}>
                    <Icon
                      className={`h-6 w-6 ${card.color}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">
                        {card.name}
                      </dt>
                      <dd>
                        <div className="text-3xl font-semibold text-slate-900">
                          {card.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          Welcome to X-AI Platform
        </h3>
        <p className="text-slate-600 max-w-3xl">
          X-AI is your complete Explainable AI workspace. Start by uploading a
          dataset, train a machine learning model, and generate predictions. Use
          our Explainability tools to understand exactly why your model makes
          specific decisions, and ask our AI assistant for deep insights.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-100 bg-slate-50 rounded-xl p-6">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              1. Upload Data
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Upload your CSV datasets to begin. We automatically parse and
              prepare your data for modeling.
            </p>
          </div>
          <div className="border border-slate-100 bg-slate-50 rounded-xl p-6">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              2. Train Models
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Select an algorithm and target variable to train your model. We
              support Random Forest, Decision Trees, and more.
            </p>
          </div>
          <div className="border border-slate-100 bg-slate-50 rounded-xl p-6">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-indigo-500" />
              3. Predict & Explain
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Make predictions on new data and see exactly which features drove
              the decision using SHAP values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
