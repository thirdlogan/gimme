const webpack = require("webpack");

module.exports = {
    mode: 'development',
    // WINDOWS: context: 'C:\\Users\\wrait\\Source\\thirdlogan\\gimme',
    context: '/Users/dis/Source/thirdlogan/gimme',
    entry: {
        background: './background/EventPage.js',
        content: './content/ContentPeeper.js',
        options: './options/options.js',
        popup: './popup/popup.js'
    },
    output: {
        // WINDOWS: path: 'C:\\Users\\wrait\\Source\\thirdlogan\\gimme',
        path: '/Users/dis/Source/thirdlogan/gimme',
        filename: './[name]/bundle.js',
        publicPath: "./",
        libraryTarget: 'umd',
        globalObject: 'window',
        umdNamedDefine: true
    },
    module: {
        rules:[
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                            'useBuiltIns': 'entry',
                            'corejs': 3
                          }],
                        ],
                        plugins: [
                            '@babel/plugin-transform-classes',
                            ['@babel/plugin-transform-runtime', {
                                'regenerator': false,
                                'useESModules': true,
                            }]
                        ]
                    }
                }
            }
        ]
    },
    resolve: {
        modules: [ 'node_modules', './' ]
    },
    devtool: 'source-map',
    target: 'web'
};
