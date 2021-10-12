var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/index.ts
import { extname, resolve } from "path";
import { readFileSync, pathExists } from "fs-extra";

// src/utils.ts
var isAbsoluteUrl = (url) => {
  return /^(https?:)?\/\/.+/.test(url);
};
var addTrailingSlash = (str) => {
  return str.substr(-1) === "/" ? str : `${str}/`;
};

// src/index.ts
function htmlPlugin(userOptions) {
  let viteConfig = null;
  if (!userOptions.template && !userOptions.templateContent) {
    if (pathExists(resolve("index.html"))) {
      userOptions.template = "index.html";
    } else {
      return;
    }
  }
  return {
    name: "vite-plugin-html",
    config(cfg) {
      var _a, _b, _c;
      cfg.build = __spreadProps(__spreadValues({}, cfg.build), {
        rollupOptions: __spreadProps(__spreadValues({}, (_a = cfg == null ? void 0 : cfg.build) == null ? void 0 : _a.rollupOptions), {
          preserveEntrySignatures: "exports-only",
          output: __spreadProps(__spreadValues({}, (_c = (_b = cfg == null ? void 0 : cfg.build) == null ? void 0 : _b.rollupOptions) == null ? void 0 : _c.output), {
            format: "es"
          }),
          input: userOptions.input
        })
      });
      return cfg;
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    async generateBundle(_, bundle) {
      const htmlTags = classifyFiles(getFiles(bundle), viteConfig);
      const html = injectToHtml(parseTemplate(userOptions.template, userOptions.templateContent), htmlTags);
      this.emitFile({
        type: "asset",
        source: html,
        name: "html",
        fileName: "index.html"
      });
    },
    transformIndexHtml(html) {
      const entryTag = {
        tag: "script",
        attrs: {
          type: "module",
          src: userOptions.input
        },
        injectTo: "body"
      };
      return [entryTag];
    }
  };
}
function parseTemplate(template, templateContent) {
  if (template) {
    return readFileSync(resolve(template), "utf-8");
  }
  if (templateContent) {
    return templateContent;
  }
}
function classifyFiles(files, config) {
  const htmlTags = [];
  for (let i = 0; i < files.length; ++i) {
    if (files[i].ext === ".css") {
      htmlTags.push({
        tag: "link",
        attrs: {
          rel: "stylesheet",
          href: toPublicPath(files[i].fileName, config)
        },
        injectTo: "head"
      });
    }
    if (files[i].ext === ".js" && files[i].isEntry) {
      htmlTags.push({
        tag: "script",
        attrs: {
          type: "module",
          src: toPublicPath(files[i].fileName, config)
        },
        injectTo: "body"
      });
    }
  }
  return htmlTags;
}
function getFiles(bundle) {
  return Object.values(bundle).map((file) => __spreadProps(__spreadValues({}, file), {
    ext: extname(file.fileName)
  }));
}
function toPublicPath(filename, config) {
  return isAbsoluteUrl(filename) ? filename : addTrailingSlash(config.base) + filename;
}
var headInjectRE = /<\/head>/;
var bodyInjectRE = /<\/body>/;
function injectToHtml(html, tags) {
  let _html = html;
  const hasHeadElement = headInjectRE.test(html);
  const hasBodyElement = bodyInjectRE.test(html);
  tags.forEach((tag) => {
    if (tag.injectTo === "head" && hasHeadElement) {
      _html = _html.replace(headInjectRE, `${serializeTag(tag)}
$&`);
    }
    if (tag.injectTo === "body" && hasBodyElement) {
      _html = _html.replace(bodyInjectRE, `${serializeTag(tag)}
$&`);
    }
  });
  return _html;
}
var unaryTags = new Set(["link", "meta", "base"]);
function serializeTag({ tag, attrs, children }) {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`;
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(children)}</${tag}>`;
  }
}
function serializeTags(tags) {
  if (typeof tags === "string") {
    return tags;
  } else if (tags) {
    return tags.map(serializeTag).join("\n  ");
  }
  return "";
}
function serializeAttrs(attrs) {
  let res = "";
  for (const key in attrs) {
    if (typeof attrs[key] === "boolean") {
      res += attrs[key] ? ` ${key}` : "";
    } else {
      res += ` ${key}=${JSON.stringify(attrs[key])}`;
    }
  }
  return res;
}
export {
  htmlPlugin as default
};
