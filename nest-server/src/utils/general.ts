/**
 * 根据文件名获取文件类型
 * @param filename 文件名
 * @returns 文件类型
 */
export const getFileSuffixByName = (filename: string) => {
  const fileSuffix = filename
    .substring(filename.lastIndexOf('.') + 1)
    .toLowerCase();
  switch (fileSuffix) {
    case 'avi':
    case 'mpeg':
    case 'wmv':
    case 'mov':
    case 'flv':
    case 'mp4':
      return 'video';
    case 'png':
    case 'jpeg':
    case 'jpg':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'image';
    default:
      return 'file';
  }
};
