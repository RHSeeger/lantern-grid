import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // Path to current file
const __dirname = path.dirname(__filename); // Directory of current file
const STATIC_DIR = path.resolve(__dirname, 'src/static');

/** Lists every file under a directory, as paths relative to it (with / separators). */
function listFiles(dir, prefix = '') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
    });
}

/**
 * Copies src/static/ (the word lists, icons and web app manifest) into the output unchanged, at the same paths.
 * Done as a tiny local plugin rather than adding another package.
 */
class CopyStaticFilesPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('CopyStaticFilesPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                { name: 'CopyStaticFilesPlugin', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
                () => {
                    compilation.contextDependencies.add(STATIC_DIR);
                    for (const rel of listFiles(STATIC_DIR)) {
                        const source = new webpack.sources.RawSource(fs.readFileSync(path.join(STATIC_DIR, rel)));
                        compilation.emitAsset(rel, source);
                    }
                },
            );
        });
    }
}

/**
 * The build. `npm run build` passes --mode production (small, for deploying); `npm start` runs in development mode
 * (readable, with inline source maps).
 */
export default (env, argv) => ({
    entry: {
        app: __dirname + '/src/typescript/index.ts',
        // The service worker must be its own file at the site root, so it can control the whole site
        sw: __dirname + '/src/typescript/serviceWorker.ts',
    },
    output: {
        filename: (pathData) => (pathData.chunk.name === 'sw' ? 'sw.js' : 'app.bundle.js'),
        // Parts loaded only when needed (family play's Firebase code)
        chunkFilename: '[name].[contenthash:8].chunk.js',
        path: path.resolve(__dirname, 'dist'), // Output directory
        clean: true, // Clean the output directory before each build
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            chunks: ['app'], // The service worker is registered by the app, not loaded by the page
            // Adds a different ?hash to the script's address on each build that changes it, so browsers (phones
            // especially) load the new script instead of a cached copy of the old one
            hash: true,
        }),
        new MiniCssExtractPlugin(),
        new CopyStaticFilesPlugin(),
        // A new value on every build, so each deploy gets a new service worker cache (and the "Update available" toast)
        new webpack.DefinePlugin({ __BUILD_VERSION__: JSON.stringify(Date.now().toString(36)) }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/, // Apply this rule to .ts and .tsx files
                // Use ts-loader to transpile TypeScript. ES modules (rather than tsconfig's CommonJS, which the tests use)
                // let webpack split out code loaded with import(), and drop unused code
                use: { loader: 'ts-loader', options: { compilerOptions: { module: 'es2020' } } },
                exclude: /node_modules/, // Exclude dependencies
            },
            {
                test: /\.css$/, // Apply this rule to .css files
                use: ['style-loader', 'css-loader'], // Use css-loader then style-loader
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i, // Match common image file types
                type: 'asset/resource', // Tells Webpack to emit the file and return the URL
            },
        ],
    },
    // The word list is big on purpose (it is fetched once, compressed, and kept for offline play)
    performance: { assetFilter: (file) => !file.endsWith('.txt') && !file.endsWith('.map') },
    mode: argv.mode === 'production' ? 'production' : 'development',
    devtool: argv.mode === 'production' ? 'source-map' : 'inline-source-map',
    devServer: {
        static: path.resolve(__dirname, 'dist'), // Serve static files from the 'dist' directory
        port: 3000, // Serve the app on http://localhost:3000
        host: '0.0.0.0', // Also reachable from phones on the same network (http://<this computer's IP>:3000)
        open: true, // Automatically open the browser when the server starts
    },
});
