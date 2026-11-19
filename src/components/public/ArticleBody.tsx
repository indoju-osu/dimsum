/**
 * Render konten artikel yang disimpan sebagai teks biasa.
 *
 * Format yang didukung (sengaja sederhana & aman):
 *   "## "  -> sub-judul (h2)
 *   "### " -> sub-judul kecil (h3)
 *   "- "   -> daftar berpoin
 *   "> "   -> kutipan
 *   baris kosong memisahkan paragraf
 *
 * Konten TIDAK pernah dirender dengan dangerouslySetInnerHTML, sehingga
 * markup apa pun dari input admin tetap tampil sebagai teks (anti-XSS).
 */
export function ArticleBody({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`}>{paragraph.join(' ')}</p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{line.slice(3)}</h2>);
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={`h3-${blocks.length}`}>{line.slice(4)}</h3>);
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push(<blockquote key={`q-${blocks.length}`}>{line.slice(2)}</blockquote>);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return <div className="article-body">{blocks}</div>;
}

export default ArticleBody;
