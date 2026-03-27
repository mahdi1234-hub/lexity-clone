export function selectRelevantContent(content: string, query: string, maxLength = 2000): string {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const intro = paragraphs.slice(0, 2).join('\n\n');
  const keywords = query.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['what', 'when', 'where', 'which', 'how', 'why', 'does', 'with', 'from', 'about'].includes(word));

  const relevantParagraphs = paragraphs.slice(2, -2)
    .map((paragraph, index) => ({
      text: paragraph,
      score: keywords.filter(keyword => paragraph.toLowerCase().includes(keyword)).length,
      index
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map(p => p.text);

  const conclusion = paragraphs.length > 2 ? paragraphs[paragraphs.length - 1] : '';
  let result = intro;
  if (relevantParagraphs.length > 0) {
    result += '\n\n' + relevantParagraphs.join('\n\n');
  }
  if (conclusion) {
    result += '\n\n' + conclusion;
  }
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + '...';
  }
  return result;
}
