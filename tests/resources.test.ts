import {describe,it,expect} from 'vitest';
import {RESOURCE_CATALOG,filterResources} from '../resources/catalog';

describe('资源库目录与可用入口',()=>{
 it('每项资源只有一个明确入口，外链使用已核对的 HTTPS 来源',()=>{
  expect(RESOURCE_CATALOG.length).toBeGreaterThan(10);
  expect(new Set(RESOURCE_CATALOG.map(r=>r.id)).size).toBe(RESOURCE_CATALOG.length);
  const hosts=['www.icourse163.org','ocw.mit.edu','xuanshu.hep.com.cn','www.geogebra.org','www.desmos.com','www.latexlive.com'];
  for(const r of RESOURCE_CATALOG){
   expect(Boolean(r.url)!==Boolean(r.module)).toBe(true);
   expect(r.source.length).toBeGreaterThan(1);
   expect(r.accessNote.length).toBeGreaterThan(5);
   if(r.url){const u=new URL(r.url);expect(u.protocol).toBe('https:');expect(hosts).toContain(u.hostname);expect(r.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);}
  }
 });
 it('开放筛选不把教材商品页和登录课程误列为免费全文',()=>{
  const open=filterResources(RESOURCE_CATALOG,{openOnly:true});
  expect(open.length).toBeGreaterThan(3);
  expect(open.every(r=>r.access==='open')).toBe(true);
  expect(open.some(r=>r.id==='book-liu')).toBe(false);
  expect(open.some(r=>r.id==='course-dlut')).toBe(false);
 });
 it('搜索同时匹配标题、作者、机构和主题，可叠加分类与难度',()=>{
  expect(filterResources(RESOURCE_CATALOG,{query:'  刘鸿文  '}).map(r=>r.id)).toContain('book-liu');
  expect(filterResources(RESOURCE_CATALOG,{query:'mit',category:'practice'}).map(r=>r.id)).toEqual(['practice-mit']);
  expect(filterResources(RESOURCE_CATALOG,{query:'扭转',category:'reading',difficulty:'advanced'}).map(r=>r.id)).toContain('book-roylance');
  expect(filterResources(RESOURCE_CATALOG,{query:'没有这项资源'})).toEqual([]);
 });
 it('站内资料接入实际模块，不使用空链接或伪装为下载',()=>{
  const local=RESOURCE_CATALOG.filter(r=>r.category==='local');
  expect(local.map(r=>r.module).sort()).toEqual(['formulas','fundamentals','section']);
  expect(local.every(r=>!r.url&&r.access==='local')).toBe(true);
 });
});
