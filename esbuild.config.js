import esbuild from 'esbuild';

const buildOptions = {
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/bundle.js',
  format: 'esm',
  external: ['@xenova/transformers'], // This is a large library, better to keep it external
};

esbuild.build(buildOptions).catch(() => process.exit(1));

console.log('Build successful!');
