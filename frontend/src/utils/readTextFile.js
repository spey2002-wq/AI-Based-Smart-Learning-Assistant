const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.html', '.htm'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export function isTextFile(file) {
  if (file.type.startsWith('text/')) return true;
  const name = file.name.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`"${file.name}" exceeds the 2 MB limit.`));
      return;
    }

    if (!isTextFile(file)) {
      reject(
        new Error(
          `"${file.name}" is not supported yet. Use .txt, .md, or other plain text files.`
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsText(file);
  });
}
