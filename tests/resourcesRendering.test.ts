import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {ResourcesModule} from '../modules/ResourcesModule';
import {RESOURCE_CATALOG} from '../resources/catalog';

describe('资源目录可访问入口',()=>{
 it('每项资源在列表中都有标题及操作，不生成空链接',()=>{
  const html=renderToStaticMarkup(React.createElement(ResourcesModule,{onNavigate:()=>{}}));
  expect(html).not.toMatch(/href="(?:#|undefined|)"/);
  expect(html).not.toContain('线下资源');
  for(const r of RESOURCE_CATALOG){expect(html).toContain(r.action);if(r.url)expect(html).toContain(r.url.replaceAll('&','&amp;'));}
  expect(html).not.toContain('学术论文 0');
 });
 it('外部目标在新标签页打开并隔离 opener，站内目标保留按钮导航',()=>{
  const html=renderToStaticMarkup(React.createElement(ResourcesModule,{onNavigate:()=>{}}));
  const anchors=html.match(/<a\b[^>]*>/g)??[];
  expect(anchors.length).toBeGreaterThan(10);
  for(const a of anchors){expect(a).toContain('target="_blank"');expect(a).toContain('rel="noopener noreferrer"');expect(a).toContain('href="https://');}
  expect(html).toContain('进入截面计算');
  expect(html).not.toContain('disabled=""');
 });
});
