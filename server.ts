import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { createServer as createViteServer } from 'vite';
import { initDb } from './database.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const db = await initDb();
  
  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // API Routes
  app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
      const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET);
      res.json({ token, user: { id: result.lastID, email } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/upload-dataset', authenticate, upload.single('file'), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const results: any[] = [];
    let columns: string[] = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('headers', (headers) => {
        columns = headers;
      })
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const result = await db.run(
          'INSERT INTO datasets (user_id, name, filename, columns, row_count) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, req.file.originalname, req.file.filename, JSON.stringify(columns), results.length]
        );
        res.json({ id: result.lastID, name: req.file.originalname, columns, rowCount: results.length });
      });
  });

  app.get('/api/datasets', authenticate, async (req: any, res) => {
    const datasets = await db.all('SELECT * FROM datasets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(datasets.map(d => ({ ...d, columns: JSON.parse(d.columns) })));
  });

  app.post('/api/train-model', authenticate, async (req: any, res) => {
    const { datasetId, name, algorithm, targetColumn } = req.body;
    
    // Fetch dataset
    const dataset = await db.get('SELECT * FROM datasets WHERE id = ? AND user_id = ?', [datasetId, req.user.id]);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const columns = JSON.parse(dataset.columns);
    const featureColumns = columns.filter((c: string) => c !== targetColumn);
    
    // Mock ML Training
    const metrics = {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.82 + Math.random() * 0.1,
      recall: 0.80 + Math.random() * 0.1,
      f1Score: 0.83 + Math.random() * 0.1
    };

    // Generate mock feature importance
    const featureImportance = featureColumns.map((col: string) => ({
      feature: col,
      importance: Math.random()
    })).sort((a: any, b: any) => b.importance - a.importance);

    // Normalize importance
    const totalImportance = featureImportance.reduce((sum: number, f: any) => sum + f.importance, 0);
    featureImportance.forEach((f: any) => f.importance /= totalImportance);

    const result = await db.run(
      'INSERT INTO models (user_id, dataset_id, name, algorithm, target_column, status, metrics, feature_importance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, datasetId, name, algorithm, targetColumn, 'completed', JSON.stringify(metrics), JSON.stringify(featureImportance)]
    );

    res.json({ id: result.lastID, name, algorithm, status: 'completed', metrics, featureImportance });
  });

  app.get('/api/models', authenticate, async (req: any, res) => {
    const models = await db.all(`
      SELECT m.*, d.name as dataset_name, d.columns as dataset_columns 
      FROM models m 
      JOIN datasets d ON m.dataset_id = d.id 
      WHERE m.user_id = ? 
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    
    res.json(models.map(m => ({
      ...m,
      metrics: JSON.parse(m.metrics),
      feature_importance: JSON.parse(m.feature_importance),
      dataset_columns: JSON.parse(m.dataset_columns)
    })));
  });

  app.post('/api/predict', authenticate, async (req: any, res) => {
    const { modelId, inputData } = req.body;
    
    const model = await db.get('SELECT * FROM models WHERE id = ? AND user_id = ?', [modelId, req.user.id]);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    const featureImportance = JSON.parse(model.feature_importance);
    
    // Mock prediction
    const predictionResult = Math.random() > 0.5 ? 'Positive' : 'Negative';
    
    // Mock SHAP values based on input and feature importance
    const shapValues = featureImportance.map((f: any) => {
      const value = inputData[f.feature] || 0;
      // Random SHAP value influenced by feature importance
      const shap = (Math.random() * 2 - 1) * f.importance * 10;
      return { feature: f.feature, value: shap };
    });

    const result = await db.run(
      'INSERT INTO predictions (user_id, model_id, input_data, prediction_result, shap_values) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, modelId, JSON.stringify(inputData), predictionResult, JSON.stringify(shapValues)]
    );

    res.json({ id: result.lastID, prediction: predictionResult, shapValues });
  });

  app.get('/api/predictions', authenticate, async (req: any, res) => {
    const predictions = await db.all(`
      SELECT p.*, m.name as model_name, m.target_column 
      FROM predictions p 
      JOIN models m ON p.model_id = m.id 
      WHERE p.user_id = ? 
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(predictions.map(p => ({
      ...p,
      input_data: JSON.parse(p.input_data),
      shap_values: JSON.parse(p.shap_values)
    })));
  });

  app.get('/api/dashboard-stats', authenticate, async (req: any, res) => {
    const datasetsCount = await db.get('SELECT COUNT(*) as count FROM datasets WHERE user_id = ?', [req.user.id]);
    const modelsCount = await db.get('SELECT COUNT(*) as count FROM models WHERE user_id = ?', [req.user.id]);
    const predictionsCount = await db.get('SELECT COUNT(*) as count FROM predictions WHERE user_id = ?', [req.user.id]);
    
    res.json({
      datasets: datasetsCount.count,
      models: modelsCount.count,
      predictions: predictionsCount.count
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
