/**
 * Formats a value given in bytes
 * to human readable short form.
 *
 * @param bytes number to format
 * @returns number formated in short form
 */
export function bytesToSize(bytes: number): string {
  switch (bytes) {
    case 0:
      return '0 bytes';
    case 1:
      return '1 byte';
  }

  const sizes: string[] = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i: number = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());

  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  } else {
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}
