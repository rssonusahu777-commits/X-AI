import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server.cjs',
  external: ['express', 'sqlite3', 'bcryptjs', 'jsonwebtoken', 'multer', 'cors', 'csv-parser', 'vite'],
  format: 'cjs',
}).catch(() => process.exit(1));
