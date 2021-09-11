
import { extname, resolve } from 'path';
import { readFileSync } from 'fs';
import type { Plugin, ResolvedConfig, HtmlTagDescriptor } from 'vite';
import type { OutputBundle, OutputAsset, OutputChunk } from 'rollup';
import { isAbsoluteUrl, addTrailingSlash } from './utils';
// import { assert } from 'console';

export interface HtmlPluginOptions {
  /**
   * Adds the given favicon path to the output html
   * Default: `false`
   */
  favicon?: false | string;

  /**
   * The file to write the html to. Also you can specify a subdirectory here.
   * Default: `index.html`
   */
  filename?: string;

  /**
   * Accept `.[j|t]s?[x]` as input, which works like webpack input.
   * Default: `src/main.[j|t]s?[x]`
   */
  input?: string;

  /**
   * Pass a html-minifier options object to minify the output.
   * Default: `false`
   */
  meta?: false;

  /**
   * The `webpack` require path to the template
   */
  template?: string ;

  /**
   * Allow to use a html string instead of reading from a file.
   * Default: `false`
   */
  templateContent?: false | string;

  /**
   * The title to use for the generated HTML document.
   * Default: `Vite App`
   */
  title?: string;

  /**
   * The publicPath use for the generates assets.
   * Default: `auto`.
   */
  publicPath?: 'auto' | string;
}

export type OutputBundleExt =
  | (OutputAsset & { ext: string })
  | (OutputChunk & { ext: string });

export default function htmlPlugin(userOptions?: HtmlPluginOptions): Plugin {
  let viteConfig: ResolvedConfig = null;

  if (!userOptions.template && !userOptions.templateContent) {
    return;
  }

  return {
    name: 'vite-plugin-html',
    apply: 'build',

    config(cfg) {
      // eslint-disable-next-line no-param-reassign
      cfg.build = {
        ...cfg.build,
        rollupOptions: {
          ...cfg?.build?.rollupOptions,
          output: {
            ...cfg?.build?.rollupOptions?.output,
            format: 'es',
          },
          input: userOptions.input,
        },
      };
    },

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },

    async generateBundle(_, bundle) {
      const htmlTags = classifyFiles(
        getFiles(bundle),
        viteConfig,
      );

      const html = injectToHtml(
        parseTemplate(userOptions.template, userOptions.templateContent),
        htmlTags,
      );

      this.emitFile({
        type: 'asset',
        source: html,
        name: 'html',
        fileName: 'index.html',
      });
    },
  };
}

function parseTemplate(template?: string, templateContent?: string | false): string {
  if (template) {
    return readFileSync(resolve(template), 'utf-8');
  }

  if (templateContent) {
    return templateContent;
  }
}

function classifyFiles(files: OutputBundleExt[], config: ResolvedConfig): HtmlTagDescriptor[] {
  const htmlTags: HtmlTagDescriptor[] = [];

  for (let i = 0; i < files.length; ++i) {
    if (files[i].ext === '.css') {
      htmlTags.push({
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: toPublicPath(files[i].fileName, config),
        },
        injectTo: 'head',
      });
    }

    // Only appends entry file
    if (files[i].ext === '.js' && (files[i] as OutputChunk).isEntry) {
      htmlTags.push({
        tag: 'script',
        attrs: {
          type: 'module',
          src: toPublicPath(files[i].fileName, config),
        },
        injectTo: 'body',
      });
    }
  }

  return htmlTags;
}

function getFiles(bundle: OutputBundle): OutputBundleExt[] {
  return Object.values(bundle)
    .map((file) => ({
      ...file,
      ext: extname(file.fileName),
    }));
}

function toPublicPath(filename: string, config: ResolvedConfig) {
  return isAbsoluteUrl(filename) ? filename : addTrailingSlash(config.base) + filename;
}

const headInjectRE = /<\/head>/;
const bodyInjectRE = /<\/body>/;

function injectToHtml(html: string, tags: HtmlTagDescriptor[]) {
  let _html = html;
  const hasHeadElement = headInjectRE.test(html);
  const hasBodyElement = bodyInjectRE.test(html);
  tags.forEach((tag) => {
    if (tag.injectTo === 'head' && hasHeadElement) {
      _html = _html.replace(headInjectRE, `${serializeTag(tag)}\n$&`);
    }

    if (tag.injectTo === 'body' && hasBodyElement) {
      _html = _html.replace(bodyInjectRE, `${serializeTag(tag)}\n$&`);
    }
  });


  return _html;
}

const unaryTags = new Set(['link', 'meta', 'base']);

function serializeTag({ tag, attrs, children }: HtmlTagDescriptor): string {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`;
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(children)}</${tag}>`;
  }
}

function serializeTags(tags: HtmlTagDescriptor['children']): string {
  if (typeof tags === 'string') {
    return tags;
  } else if (tags) {
    return tags.map(serializeTag).join('\n  ');
  }
  return '';
}

function serializeAttrs(attrs: HtmlTagDescriptor['attrs']): string {
  let res = '';
  for (const key in attrs) {
    if (typeof attrs[key] === 'boolean') {
      res += attrs[key] ? ` ${key}` : '';
    } else {
      res += ` ${key}=${JSON.stringify(attrs[key])}`;
    }
  }
  return res;
}
