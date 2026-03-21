/**
 * 通用下載工具函數
 * 統一處理文字檔案的下載邏輯
 */

/**
 * 下載文字內容為檔案
 * @param content 文字內容
 * @param filename 檔名
 * @param mimeType MIME 類型，預設 text/plain
 */
export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
