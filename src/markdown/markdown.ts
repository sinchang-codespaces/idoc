import path from 'path';
import fs from 'fs-extra';
import { render, Data } from 'ejs';
import { Options } from '@wcj/markdown-to-html';
import { config } from '../utils/conf';
import {rehypeAutolinkHeadings, rehypeSlug, rehypeIgnore, markdownToHTML } from './plugins';

type TemplateData = {
  markdown?: string;
  RELATIVE_PATH?: string;
}

export async function createHTML(str: string = '', from: string, to: string) {
  const mdOptions: Options = {};
  const autolinkHeadings = await rehypeAutolinkHeadings();
  const slug = await rehypeSlug();
  const ignore = await rehypeIgnore();
  mdOptions.rehypePlugins = [[ignore, {
    openDelimiter: 'idoc:ignore:start',
    closeDelimiter: 'idoc:ignore:end',
  }], [slug], [autolinkHeadings]];

  mdOptions.rewrite = (node, index, parent) => {
    if (node.type == 'element' && /h(1|2|3|4|5|6)/.test(node.tagName) && node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children = node.children.map(item => {
        if (item.type === 'element' && item.tagName === 'a') {
          item.properties.class = 'anchor'
        }
        return item
      });
    }
  }
  const mdHtml = await markdownToHTML(str, mdOptions) as string;
  const tempPath = path.resolve(config.data.theme, 'markdown.ejs')
  const tmpStr = await fs.readFile(tempPath);
  const data: Data & TemplateData = {}
  data.markdown = mdHtml;
  data.site = config.data.site;
  data.title = config.data.site || 'idoc';
  data.RELATIVE_PATH = config.getRelativePath(to);
  if (config.data.data && config.data.data.menus) {
    data.menus = config.getMenuData(to);
  }
  return render(tmpStr.toString(), { ...config.data.data, ...data }, {
    filename: tempPath
  });
}