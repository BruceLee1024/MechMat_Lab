/** 按完整页面截图生成 PDF，不修改实验界面的样式或滚动状态。 */
export async function renderPagesToPdf(pages: HTMLElement[]): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const body = page.querySelector('.report-body'), footer = page.querySelector('.report-footer');
    if (page.scrollHeight > page.clientHeight + 2 || (body && footer && body.getBoundingClientRect().bottom > footer.getBoundingClientRect().top - 12)) throw new Error('报告内容超出页面，请缩短名称或减少绘图复杂度后重试');
    const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', width: page.clientWidth, height: page.clientHeight, windowWidth: 1200, windowHeight: 1200, scrollX: 0, scrollY: 0 });
    if (!canvas.width || !canvas.height) throw new Error('报告截图失败，请重试');
    if (i) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }
  return pdf.output('blob');
}

/** 保留旧工具入口；在隔离的副本上截图，标题使用纯文本。 */
export async function exportModuleToPdf(element: HTMLElement, title: string, subtitle?: string): Promise<void> {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:white;';
  const heading = document.createElement('h1'); heading.textContent = title; host.appendChild(heading);
  if (subtitle) { const description = document.createElement('p'); description.textContent = subtitle; host.appendChild(description); }
  host.appendChild(element.cloneNode(true)); document.body.appendChild(host);
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    const canvas = await html2canvas(host, { scale: 2, useCORS: true, logging: false });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const height = canvas.height * 194 / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 8, 194, Math.min(height, 281));
    pdf.save(`${title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 80) || '实验记录'}.pdf`);
  } finally { host.remove(); }
}
