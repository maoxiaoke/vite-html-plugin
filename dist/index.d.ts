import { Plugin } from 'vite';
import { OutputAsset, OutputChunk } from 'rollup';

interface HtmlPluginOptions {
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
    template?: string;
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
declare type OutputBundleExt = (OutputAsset & {
    ext: string;
}) | (OutputChunk & {
    ext: string;
});
declare function htmlPlugin(userOptions?: HtmlPluginOptions): Plugin;

export { HtmlPluginOptions, OutputBundleExt, htmlPlugin as default };
