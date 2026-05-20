// ── Navigation ──────────────────────────────────────────────
function showSection(name) {
  ['home', 'about', 'contact'].forEach(s => {
    document.getElementById('section-' + s).style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-links a').forEach((a, i) => {
    a.classList.remove('active');
    if (
      (name === 'home'    && i === 0) ||
      (name === 'about'   && i === 1) ||
      (name === 'contact' && i === 2)
    ) {
      a.classList.add('active');
    }
  });
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function handleSubmit() {
  const inputs = document.querySelectorAll('#section-contact input, #section-contact textarea');
  const filled = Array.from(inputs).every(i => i.value.trim() !== '');
  if (!filled) {
    alert('Please fill in all fields before sending.');
    return;
  }
  alert('Your message has been sent. The dialogue begins.');
  inputs.forEach(i => i.value = '');
}

// ── Article loader ───────────────────────────────────────────
const GITHUB_USER = 'StaurosChs';
const GITHUB_REPO = 'dialogos';
const ARTICLES_PATH = '_articles';

// Parse simple YAML front matter (key: value only, no nested)
function parseFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    // Remove surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  });
  // Body is everything after the closing ---
  meta.body = text.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  return meta;
}

// Very simple markdown → HTML (bold, italic, paragraphs, headings)
function simpleMarkdown(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|o])/gm, '')
    .split('\n').filter(l => l.trim()).map(l =>
      l.startsWith('<h') ? l : `<p>${l}</p>`
    ).join('');
}

async function loadArticles() {
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ARTICLES_PATH}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return; // No articles folder yet — keep static content
    const files = await res.json();
    if (!Array.isArray(files) || files.length === 0) return;

    // Fetch all article files
    const articles = await Promise.all(
      files
        .filter(f => f.name.endsWith('.md'))
        .map(async f => {
          const r = await fetch(f.download_url);
          const text = await r.text();
          return parseFrontMatter(text);
        })
    );

    // Sort by date descending
    articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    if (articles.length === 0) return;

    renderArticles(articles);
  } catch (e) {
    console.warn('Could not load articles from GitHub:', e);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return dateStr; }
}

function renderArticles(articles) {
  const featured = articles[0];
  const rest = articles.slice(1, 4); // Show up to 3 in sidebar

  // ── Featured article ──
  const featuredEl = document.querySelector('.article-featured');
  if (featuredEl) {
    featuredEl.innerHTML = `
      <span class="article-tag">✦ ${featured.category || 'Article'}</span>
      <h3>${featured.title || 'Untitled'}</h3>
      <p>${featured.summary || featured.body.slice(0, 200) + '…'}</p>
      <div class="article-meta">${formatDate(featured.date)}${featured.readtime ? ' · ' + featured.readtime : ''}</div>
    `;
    featuredEl.style.cursor = 'pointer';
    featuredEl.onclick = () => openArticle(featured);
  }

  // ── Sidebar articles ──
  const stack = document.querySelector('.articles-stack');
  if (stack && rest.length > 0) {
    stack.innerHTML = rest.map(a => `
      <div class="article-small" onclick="openArticleByTitle('${encodeURIComponent(a.title || '')}')">
        <span class="article-tag" style="font-size:0.55rem;">✦ ${a.category || 'Article'}</span>
        <h4>${a.title || 'Untitled'}</h4>
        <p>${a.summary || a.body.slice(0, 100) + '…'}</p>
        <div class="article-meta" style="margin-top:0.75rem;font-size:0.7rem;">${formatDate(a.date)}</div>
      </div>
    `).join('');
  }

  // Store articles globally for lookup
  window._loadedArticles = articles;
}

function openArticleByTitle(encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  const article = (window._loadedArticles || []).find(a => a.title === title);
  if (article) openArticle(article);
}

function openArticle(article) {
  // Create or reuse article view section
  let section = document.getElementById('section-article');
  if (!section) {
    section = document.createElement('div');
    section.id = 'section-article';
    document.querySelector('footer').before(section);
  }

  section.innerHTML = `
    <div style="max-width:740px;margin:0 auto;padding:4rem 2rem;">
      <div style="margin-bottom:2rem;">
        <span class="article-tag">✦ ${article.category || 'Article'}</span>
        <h1 style="font-family:'IM Fell English',serif;font-size:2.5rem;font-style:italic;color:var(--ink);line-height:1.2;margin:0.5rem 0 1rem;">${article.title || 'Untitled'}</h1>
        <div class="article-meta">${formatDate(article.date)}${article.readtime ? ' · ' + article.readtime : ''}</div>
        <div style="margin-top:1.5rem;border-top:1px solid var(--border);"></div>
      </div>
      <div style="font-size:1.05rem;line-height:1.9;color:var(--ink-mid);">
        ${simpleMarkdown(article.body)}
      </div>
      <div style="margin-top:3rem;border-top:1px solid var(--border);padding-top:2rem;">
        <span class="hero-cta" onclick="showSection('home')" style="display:inline-flex;">← Back to Articles</span>
      </div>
    </div>
  `;

  ['home', 'about', 'contact'].forEach(s => {
    document.getElementById('section-' + s).style.display = 'none';
  });
  section.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update nav
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
}

// Load articles on page ready
document.addEventListener('DOMContentLoaded', loadArticles);
