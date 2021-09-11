
import type { Plugin } from 'vite';

interface HtmlPluginOptions {
  /**
   * Adds the given favicon path to the output html
   * Default: `false`
   */
  favicon?: false | string | undefined;

  /**
   * The file to write the html to. Also you can specify a subdirectory here.
   * Default: `index.html`
   */
  filename?: string | undefined;

  /**
   * Pass a html-minifier options object to minify the output.
   * Default: `false`
   */
  meta?: false | undefined;

  /**
   * The `webpack` require path to the template
   */
  template?: string | undefined;

  /**
   * Allow to use a html string instead of reading from a file.
   * Default: `false`
   */
  templateContent?: false | string | undefined;

  /**
   * The title to use for the generated HTML document.
   * Default: `Vite App`
   */
  title?: string | undefined;

  /**
   * The publicPath use for the generates assets.
   * Default: `auto`.
   */
  publicPath: 'auto' | undefined | string;
}

export default function htmlPlugin(userOptions: HtmlPluginOptions): Plugin {
  let viteConfig = null;
  return {
    name: 'vite-plugin-html',

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
  };
}
