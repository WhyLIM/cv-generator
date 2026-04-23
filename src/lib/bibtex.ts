export const parseBibtex = (bibtexStr: string) => {
  const parsedArticles = [];
  // Split the file by entries starting with @
  const entries = bibtexStr.split(/@(?=[a-zA-Z]+\{)/).filter(s => s.trim());

  for (let entry of entries) {
    if (!entry.includes('{')) continue;
    
    // Extract the body inside the main {}
    const firstBraceIdx = entry.indexOf('{');
    const lastBraceIdx = entry.lastIndexOf('}');
    if (firstBraceIdx === -1 || lastBraceIdx === -1) continue;
    
    const body = entry.substring(firstBraceIdx + 1, lastBraceIdx);
    const fields: Record<string, string> = {};

    // Match lines like `key = "value",` or `key = {value},`
    const fieldRegex = /([a-zA-Z0-9_\-]+)\s*=\s*(?:\{((?:[^{}]|(?:\{[^{}]*\}))*)\}|"([^"]*)"|([^,\n]+))/g;
    let match;
    while ((match = fieldRegex.exec(body)) !== null) {
      const key = match[1].toLowerCase();
      const value = match[2] || match[3] || match[4] || '';
      fields[key] = value.trim();
    }

    if (fields.title) {
      // Parse authors
      const authorStr = fields.author || '';
      const authorNames = authorStr.split(/\s+and\s+/i).map(a => a.trim()).filter(a => a);
      const authors = authorNames.map((name, idx) => {
         // Clean curly braces
         let cleanName = name.replace(/[{}]/g, '');
         if (cleanName.includes(',')) {
           // Handle "Last, First"
           const parts = cleanName.split(',');
           cleanName = `${parts[1].trim()} ${parts[0].trim()}`;
         }
         return {
            name: cleanName,
            isMe: false, // User will manually toggle
            isFirst: idx === 0,
            isCorresponding: false
         }
      });

      // Only push if there's a title
      parsedArticles.push({
        id: Math.random().toString(36).substr(2, 9),
        title: fields.title.replace(/[{}]/g, ''),
        journal: (fields.journal || fields.booktitle || '').replace(/[{}]/g, ''),
        year: fields.year || '',
        doi: fields.doi || '',
        volumeAndIssue: fields.volume ? `${fields.volume}${fields.number ? `(${fields.number})` : ''}` : '',
        pages: fields.pages ? fields.pages.replace(/--/g, '-') : '',
        impactFactor: undefined,
        authors: authors.length > 0 ? authors : [{name: 'Unknown', isMe: false, isFirst: true, isCorresponding: false}]
      });
    }
  }
  return parsedArticles;
};
