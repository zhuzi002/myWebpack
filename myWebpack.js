// 3. 递归的创建一个文件间的依赖图，描述所有文件间的依赖关系
// 4. 把所有的文件打包成一个文件

const fs = require("fs");
const babylon = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;
const path = require("path");
const babel = require("@babel/core");
const beautify = require("js-beautify");
const hljs = require("highlight");
// 封装读取文件内容方法
function readContent(filename) {
	const fileContent = fs.readFileSync(filename, "utf-8");
	return fileContent;
}
// // 1. 找到入口文件
// const content = readContent("./src/index.js");
// // 2. 解析入口文件内容，生成AST语法树（这里通过插件babylon先转义成ast语法树）

// const astTree = require("babylon").parse(content, {
// 	// parse in strict mode and allow module declarations
// 	sourceType: "module",
// 	plugins: [
// 		// enable jsx and flow syntax
// 		"jsx",
// 		"flow",
// 	],
// });

// // console.log("astTree", astTree);
// // 3. babel-traverse 作用是像遍历对象一样 对 AST 进行遍历转译，得到新的 AST（通过astTree中的astTree->program Node -> body Node -> ImportDeclaration Node -> source -> value ）获取entry.js 依赖
// const dependencies = [];
// const deepTraverseAstTree = require("babel-traverse").default(astTree, {
// 	// 需要遍历语法树中的属性
// 	ImportDeclaration: ({ node }) => {
// 		dependencies.push(node.source.value);
// 		console.log("dependencies", dependencies);
// 	},
// });

// 4. 封装获取所有文件依赖方法
let ID = 0;
function createAsset(filename) {
	const content = readContent(filename);
	const astTree = babylon.parse(content, {
		sourceType: "module",
	});
	const dependencies = [];
	// console.log("filename", filename);
	babelTraverse(astTree, {
		// 需要遍历语法树中的属性
		ImportDeclaration: ({ node }) => {
			// console.log("node", node);
			dependencies.push(node.source.value);
		},
	});
	const id = ID++;
	// 编译所有代码
	const { code } = babel.transformFromAst(astTree, null, {
		presets: ["@babel/preset-env"],
	});
	return {
		id,
		filename,
		dependencies,
		code,
	};
}

//递归的创建一个文件间的依赖图，需要一个map表示路径和资源的依赖关系
function createGraph(entry) {
	const mainAsset = createAsset(entry);
	// 遍历所有的资源文件
	const allAssets = [mainAsset];
	for (const asset of allAssets) {
		const dirname = path.dirname(asset.filename);
		asset.map = {};
		asset.dependencies.forEach(relativePath => {
			// 转换成绝对路径
			const absolutePath = path.join(dirname, relativePath);
			const childAsset = createAsset(absolutePath);
			asset.map[relativePath] = childAsset.id;
			allAssets.push(childAsset);
		});
	}
	return allAssets;
}
const graph = createGraph("./src/index.js");
// console.log("graph", graph);

// 创建整体的结果代码块,需要接收参数且立即执行，所以定义一个自执行函数包裹，遍历graph拿到所有的module
// 编译源代码，把编译后的代码加入result中

function bundle(graph) {
	let modules = "";
	graph.forEach(module => {
		modules += `${module.id}: [
        function(require,module,exports){
          ${module.code}
        },
        ${JSON.stringify(module.map)},
    ],`;
	});
	// 实现require方法
	const result = `
    (function(modules){
     function require(id){
      const [fn,map] = modules[id];
      function localRequire(relativePath) {
        return require(map[relativePath]);
      }
      const module = {exports: {}}
      fn(localRequire,module,module.exports)
      return module.exports;
     }
     require(0)
    })({${modules}})
  `;
	return result;
}

const result = bundle(graph);
console.log(beautify(result));
