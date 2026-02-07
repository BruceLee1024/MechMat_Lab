import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * 将模块内容导出为 PDF
 * 通过 html2canvas 截取 DOM 为图片，再用 jsPDF 生成 A4 多页 PDF。
 * 中文标题通过临时 DOM 元素注入后一起截图（避免 jsPDF 不支持中文字体）。
 */
export async function exportModuleToPdf(
  element: HTMLElement,
  title: string,
  subtitle?: string
): Promise<void> {
  // 1. 注入临时标题头
  const header = document.createElement("div");
  header.className = "export-pdf-header";
  header.style.cssText =
    "padding: 16px 0 12px 0; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0;";
  header.innerHTML = `
    <div style="font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.3;">${title}</div>
    ${subtitle ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${subtitle}</div>` : ""}
    <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
      材料力学可视化实验室 &nbsp;|&nbsp; ${new Date().toLocaleString("zh-CN")}
    </div>
  `;
  element.insertBefore(header, element.firstChild);

  // 2. 展开滚动容器，确保捕获全部内容
  const scrollParent = element.closest(".overflow-y-auto") as HTMLElement | null;
  const savedStyles: Record<string, string> = {};
  if (scrollParent) {
    savedStyles.height = scrollParent.style.height;
    savedStyles.overflow = scrollParent.style.overflow;
    savedStyles.maxHeight = scrollParent.style.maxHeight;
    scrollParent.style.height = "auto";
    scrollParent.style.overflow = "visible";
    scrollParent.style.maxHeight = "none";
  }

  // 同时展开上层 overflow-hidden 容器
  const hiddenParent = element.closest(".overflow-hidden") as HTMLElement | null;
  const savedHiddenStyles: Record<string, string> = {};
  if (hiddenParent) {
    savedHiddenStyles.overflow = hiddenParent.style.overflow;
    savedHiddenStyles.height = hiddenParent.style.height;
    hiddenParent.style.overflow = "visible";
    hiddenParent.style.height = "auto";
  }

  try {
    // 3. html2canvas 截图
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#f8fafc",
      windowHeight: element.scrollHeight + 200,
      height: element.scrollHeight,
    });

    // 4. 生成 PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const margin = 8;
    const footerHeight = 8;
    const contentWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin - footerHeight;

    // 计算图片缩放
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = contentWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    const totalPages = Math.max(1, Math.ceil(scaledHeight / availableHeight));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // 裁切当前页对应的 canvas 区域
      const sourceY = (page * availableHeight) / ratio;
      const sourceH = Math.min(availableHeight / ratio, imgHeight - sourceY);
      const destH = sourceH * ratio;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.ceil(sourceH);
      const ctx = pageCanvas.getContext("2d")!;
      ctx.drawImage(
        canvas,
        0,
        Math.floor(sourceY),
        imgWidth,
        Math.ceil(sourceH),
        0,
        0,
        imgWidth,
        Math.ceil(sourceH)
      );

      const pageImgData = pageCanvas.toDataURL("image/png");
      pdf.addImage(pageImgData, "PNG", margin, margin, contentWidth, destH);

      // 页脚：页码
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(
        `- ${page + 1} / ${totalPages} -`,
        pageWidth / 2,
        pageHeight - margin,
        { align: "center" }
      );
    }

    // 5. 下载
    const safeTitle = title.replace(/[^\w\u4e00-\u9fff]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`${safeTitle}_${dateStr}.pdf`);
  } finally {
    // 6. 清理：移除临时标题，恢复样式
    if (header.parentNode) {
      header.parentNode.removeChild(header);
    }
    if (scrollParent) {
      scrollParent.style.height = savedStyles.height;
      scrollParent.style.overflow = savedStyles.overflow;
      scrollParent.style.maxHeight = savedStyles.maxHeight;
    }
    if (hiddenParent) {
      hiddenParent.style.overflow = savedHiddenStyles.overflow;
      hiddenParent.style.height = savedHiddenStyles.height;
    }
  }
}
