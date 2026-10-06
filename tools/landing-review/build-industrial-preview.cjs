const path = require('node:path');
const webpack = require('../../frontend/node_modules/next/dist/compiled/webpack/webpack').webpack;
const frontend = path.resolve(__dirname,'../../frontend');
webpack({ mode:'development', devtool:false, entry:path.join(__dirname,'industrial-preview.tsx'),
  output:{path:path.join(__dirname,'artifacts/industrial-preview'),filename:'bundle.js'},
  resolve:{extensions:['.tsx','.ts','.js'],modules:[path.join(frontend,'node_modules'),'node_modules'],alias:{react:path.join(frontend,'node_modules/react'),'react-dom':path.join(frontend,'node_modules/react-dom')}},
  module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:[path.join(__dirname,'industrial-ts-loader.cjs')]}]},
  optimization:{minimize:false},performance:{hints:false},
},(error,stats)=>{if(error||stats.hasErrors()){console.error(error||stats.toString({errors:true}));process.exitCode=1;}else console.log(stats.toString({all:false,assets:true,timings:true}));});
