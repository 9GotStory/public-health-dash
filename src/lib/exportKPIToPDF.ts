import type { KPIInfo } from '@/types/kpi';

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

export async function exportKPIToPDF(kpiInfo: KPIInfo) {
  // Theming and sizing
  const mm = (v: number) => Math.round(v * 2.83464567); // mm -> pt
  const theme = {
    colors: {
      header: '#0b3c8a', // deep government blue
      subtext: '#6b7280',
      text: '#111827',
      label: '#1f2937',
      tableHeaderFill: '#e6f0ff',
      labelFill: '#F3F4F6',
      zebra: '#FAFAFB',
      line: '#E5E7EB',
    },
    sizes: {
      pageMargins: [mm(20), mm(18), mm(20), mm(18)] as [number, number, number, number],
      labelColWidth: 150,
      font: {
        base: 12,
        header: 16,
        tableHeader: 14,
        small: 9,
        code: 10,
      },
      cellPadding: { h: 8, v: 6 },
    },
  } as const;

  // Avoid injecting invisible characters to prevent tofu boxes in some PDF viewers.
  // We will rely on pdfmake hyphenationCallback for long non-Thai tokens instead.
  const softWrap = (s?: string) => s;
  const pdfMakeMod: any = await import('pdfmake/build/pdfmake');
  const pdfMake: any = pdfMakeMod.default || pdfMakeMod;

  // TH Sarabun New from npm package (bundled assets)
  const regularUrl = (await import('font-th-sarabun-new/fonts/THSarabunNew-webfont.ttf?url')).default as string;
  const boldUrl = (await import('font-th-sarabun-new/fonts/THSarabunNew_bold-webfont.ttf?url')).default as string;
  const italicUrl = (await import('font-th-sarabun-new/fonts/THSarabunNew_italic-webfont.ttf?url')).default as string;
  const boldItalicUrl = (await import('font-th-sarabun-new/fonts/THSarabunNew_bolditalic-webfont.ttf?url')).default as string;

  const [regular, bold, italic, bolditalic] = await Promise.all([
    urlToBase64(regularUrl),
    urlToBase64(boldUrl),
    urlToBase64(italicUrl),
    urlToBase64(boldItalicUrl),
  ]);

  pdfMake.vfs = {
    'THSarabunNew-webfont.ttf': regular,
    'THSarabunNew_bold-webfont.ttf': bold,
    'THSarabunNew_italic-webfont.ttf': italic,
    'THSarabunNew_bolditalic-webfont.ttf': bolditalic,
  };

  pdfMake.fonts = {
    Sarabun: {
      normal: 'THSarabunNew-webfont.ttf',
      bold: 'THSarabunNew_bold-webfont.ttf',
      italics: 'THSarabunNew_italic-webfont.ttf',
      bolditalics: 'THSarabunNew_bolditalic-webfont.ttf',
    },
  };

  const headerTitle = `รายละเอียดตัวชี้วัด: ${kpiInfo['ตัวชี้วัดหลัก'] || ''}`;

  const buildLabelCell = (t: string) => ({
    text: t,
    bold: true,
    color: theme.colors.label,
    fillColor: theme.colors.labelFill,
  });
  const buildValueCell = (v?: any) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return { ...v, color: theme.colors.text };
    }
    return { text: softWrap(v as string) || '-', color: theme.colors.text };
  };

  const metaRows: any[] = [];

  // Optional top metadata (if provided)
  if (kpiInfo['ประเด็นขับเคลื่อน']) metaRows.push([buildLabelCell('ประเด็นขับเคลื่อน'), buildValueCell(kpiInfo['ประเด็นขับเคลื่อน'])]);
  if (kpiInfo['กลุ่มงานย่อย']) metaRows.push([buildLabelCell('กลุ่มงานย่อย'), buildValueCell(kpiInfo['กลุ่มงานย่อย'])]);

  const dataRows: any[] = [];
  dataRows.push([buildLabelCell('ตัวชี้วัดย่อย'), buildValueCell(kpiInfo['ตัวชี้วัดย่อย'])]);
  dataRows.push([buildLabelCell('กลุ่มเป้าหมาย'), buildValueCell(kpiInfo['กลุ่มเป้าหมาย'])]);
  dataRows.push([buildLabelCell('คำนิยาม'), buildValueCell(kpiInfo['คำนิยาม'])]);
  dataRows.push([buildLabelCell('เกณฑ์เป้าหมาย'), buildValueCell(kpiInfo['เกณฑ์เป้าหมาย'])]);
  dataRows.push([buildLabelCell('ประชากรกลุ่มเป้าหมาย'), buildValueCell(kpiInfo['ประชากรกลุ่มเป้าหมาย'])]);
  dataRows.push([buildLabelCell('วิธีการจัดเก็บข้อมูล'), buildValueCell(kpiInfo['วิธีการจัดเก็บข้อมูล'])]);
  dataRows.push([buildLabelCell('แหล่งข้อมูล'), buildValueCell(kpiInfo['แหล่งข้อมูล'])]);

  const dataVars: string[] = [
    kpiInfo['รายการข้อมูล_1'],
    kpiInfo['รายการข้อมูล_2'],
    kpiInfo['รายการข้อมูล_3'],
    kpiInfo['รายการข้อมูล_4'],
    kpiInfo['รายการข้อมูล_5'],
  ].filter(Boolean) as string[];

  if (dataVars.length) {
    dataRows.push([
      buildLabelCell('รายการข้อมูลและตัวแปร'),
      { ul: dataVars.map((x, i) => `${i + 1}. ${x}`) },
    ]);
  }

  dataRows.push([buildLabelCell('เอกสารสนับสนุน'), buildValueCell(kpiInfo['เอกสารสนับสนุน'])]);
  dataRows.push([buildLabelCell('แหล่งอ้างอิง'), buildValueCell(kpiInfo['แหล่งอ้างอิง'])]);
  dataRows.push([buildLabelCell('หน่วยงานรับผิดชอบ'), buildValueCell(kpiInfo['หน่วยงานรับผิดชอบ'])]);
  dataRows.push([buildLabelCell('ผู้ประสานงาน'), buildValueCell(kpiInfo['ผู้ประสานงาน'])]);
  dataRows.push([buildLabelCell('หมายเหตุ'), buildValueCell(kpiInfo['หมายเหตุ'])]);
  dataRows.push([
    buildLabelCell('สถานะ'),
    buildValueCell(kpiInfo['สถานะใช้งาน'] === 'Active' ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'),
  ]);
  dataRows.push([buildLabelCell('วันที่สร้าง'), buildValueCell(kpiInfo['วันที่สร้าง'])]);
  dataRows.push([buildLabelCell('วันที่แก้ไขล่าสุด'), buildValueCell(kpiInfo['วันที่แก้ไขล่าสุด'])]);

  const printedAt = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  // Determine dynamic label column width based on longest label used
  const labelsUsed: string[] = [];
  // Collect labels from metaRows
  for (const row of metaRows) {
    if (Array.isArray(row) && row[0] && row[0].text) labelsUsed.push(String(row[0].text));
  }
  // Collect labels from dataRows (skip header row later)
  for (const row of dataRows) {
    if (Array.isArray(row) && row[0] && row[0].text) labelsUsed.push(String(row[0].text));
  }
  const maxLabelLen = labelsUsed.reduce((m, s) => Math.max(m, s.length), 0);
  // Approximate width per character (Thai glyph ~7.2pt at 12pt font) + padding buffer
  const approxPerChar = 7.2;
  const labelColWidthDynamic = Math.min(240, Math.max(120, Math.ceil(maxLabelLen * approxPerChar + 12)));

  // Compute fixed widths to guarantee inner gap from page edges for the main table
  const PAGE_WIDTH_PT = 595.28; // A4 portrait width in points
  const contentWidthPt = PAGE_WIDTH_PT - theme.sizes.pageMargins[0] - theme.sizes.pageMargins[2];
  const mainTableMarginH = 16; // pt left/right for main table
  const minRightCol = 180; // pt minimal right column
  let labelWidthFixed = Math.max(120, Math.min(labelColWidthDynamic, contentWidthPt - 2 * mainTableMarginH - minRightCol));
  let rightWidthFixed = Math.max(minRightCol, contentWidthPt - 2 * mainTableMarginH - labelWidthFixed);

  const docDefinition: any = {
    info: { title: headerTitle },
    pageSize: 'A4',
    pageMargins: theme.sizes.pageMargins,
    defaultStyle: { font: 'Sarabun', fontSize: theme.sizes.font.base, lineHeight: 1.15 },
    styles: {
      header: { fontSize: theme.sizes.font.header, bold: true, color: theme.colors.header, margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 11, color: theme.colors.subtext, margin: [0, 0, 0, 12] },
      tableHeader: { bold: true, color: theme.colors.text, fillColor: theme.colors.tableHeaderFill, fontSize: theme.sizes.font.tableHeader, margin: [0, 2, 0, 2] },
      labelCell: { bold: true, color: theme.colors.label },
      valueCell: { color: theme.colors.text },
      formulaTitle: { bold: true, margin: [0, 12, 0, 6] },
      codeBox: { fontSize: theme.sizes.font.code, lineHeight: 1.15 },
      small: { fontSize: theme.sizes.font.small, color: theme.colors.subtext },
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `พิมพ์เมื่อ ${printedAt}`, style: 'small' },
        { text: `หน้า ${currentPage} / ${pageCount}`, alignment: 'right', style: 'small' },
      ],
      margin: [theme.sizes.cellPadding.h*1.5, 8, theme.sizes.cellPadding.h*1.5, 0],
    }),
    hyphenationCallback: (word: string) => {
      // Do not hyphenate Thai words
      if (/[\u0E00-\u0E7F]/.test(word)) return [word];
      // Hyphenate long non-Thai tokens every 12 chars
      return word.match(/.{1,12}/g) || [word];
    },
    content: [
      { text: headerTitle, style: 'header' },
      {
        table: {
          widths: [labelWidthFixed, rightWidthFixed],
          headerRows: metaRows.length ? 1 : 0,
          body: [
            ...(metaRows.length ? [[{ text: 'ข้อมูลทั่วไป', style: 'tableHeader' }, { text: '', style: 'tableHeader' }]] : []),
            ...metaRows,
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 0.8 : 0.4),
          vLineWidth: () => 0,
          hLineColor: theme.colors.line,
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [mainTableMarginH, 6, mainTableMarginH, metaRows.length ? 14 : 0],
      },
      {
        table: {
          widths: [labelWidthFixed, rightWidthFixed],
          headerRows: 1,
          body: [
            [
              { text: 'หัวข้อ', style: 'tableHeader' },
              { text: 'รายละเอียด', style: 'tableHeader' },
            ],
            ...dataRows,
          ],
        },
        layout: {
          fillColor: (rowIndex: number, node: any) => {
            // Zebra for data rows (skip header)
            if (rowIndex === 0) return theme.colors.tableHeaderFill;
            return rowIndex % 2 === 1 ? theme.colors.zebra : null;
          },
          hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 0.8 : 0.4),
          vLineWidth: () => 0,
          hLineColor: theme.colors.line,
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [mainTableMarginH, 2, mainTableMarginH, 2],
      },
      ...(kpiInfo['สูตรการคำนวณ']
        ? [
            { text: 'สูตรการคำนวณ', style: 'formulaTitle' },
            {
              table: {
                widths: ['*'],
                body: [[{ text: kpiInfo['สูตรการคำนวณ'], style: 'codeBox' }]],
              },
              layout: {
                hLineWidth: () => 0.8,
                vLineWidth: () => 0.8,
                hLineColor: theme.colors.line,
                vLineColor: theme.colors.line,
                paddingLeft: () => 10,
                paddingRight: () => 10,
                paddingTop: () => 6,
                paddingBottom: () => 6,
              },
              margin: [mainTableMarginH, 8, mainTableMarginH, 2],
            },
          ]
        : []),
    ],
  };

  pdfMake.createPdf(docDefinition).download(
    `kpi-detail-${(kpiInfo['ตัวชี้วัดหลัก'] || '').toString().slice(0, 50)}.pdf`
  );
}
