<script>
(async function() {
  const MAX_RELATED = 4;
  const DEFAULT_IMAGE = ''; // حذف شد، فقط برای سازگاری نگه داشتیم
  const currentTitle = document.querySelector('h1.post-title, h3.post-title')?.innerText?.trim() || '';
  const currentLabels = Array.from(document.querySelectorAll('.post-labels a, a[rel="tag"]')).map(a => a.innerText.trim()).filter(Boolean);
  const currentUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

  // اگر برچسب ندارد، هیچی نمایش نده
  if (!currentLabels.length) return;

  const allPosts = [];
  
  // از همه برچسب‌ها واکشی انجام بده
  for (let lbl of currentLabels) {
    try {
      const feedUrl = `${window.location.origin}/feeds/posts/default/-/${encodeURIComponent(lbl)}?alt=json&max-results=30`;
      const res = await fetch(feedUrl);
      const data = await res.json();
      if (data.feed?.entry) {
        allPosts.push(...data.feed.entry);
      }
    } catch (e) {
      console.warn('Label fetch failed for', lbl, e);
    }
  }

  // حذف تکراری‌ها بر اساس لینک
  const unique = [];
  const linksSeen = new Set();

  for (const e of allPosts) {
    const link = e.link.find(l => l.rel === 'alternate')?.href;
    if (!link || linksSeen.has(link) || link === currentUrl) continue;
    linksSeen.add(link);

    const title = e.title?.$t || '';
    if (title === currentTitle) continue;

    const labels = e.category ? e.category.map(cat => cat.term.trim()) : [];
    const hasExactMatch = labels.some(lbl => currentLabels.includes(lbl));
    if (!hasExactMatch) continue;

    const summary = e.summary ? e.summary.$t.replace(/<[^>]+>/g, '').substring(0, 80) + '...' : '';
    unique.push({ title, link, summary });
  }

  if (!unique.length) return;

  // ساخت بلوک فقط در صورت وجود نتیجه
  const wrap = document.createElement('div');
  wrap.id = 'related-posts-container';
  wrap.innerHTML = `
    <h3 style="font-family:sans-serif;margin-top:40px;">مطالب مرتبط</h3>
    <div id="related-posts" style="display:flex;flex-wrap:wrap;gap:15px;"></div>
  `;
  document.querySelector('.post-body, article, .entry-content')?.appendChild(wrap);

  const container = wrap.querySelector('#related-posts');

  // انتخاب تصادفی تا ۴ پست
  const shuffled = unique.sort(() => 0.5 - Math.random()).slice(0, MAX_RELATED);

  shuffled.forEach(post => {
    const card = document.createElement('div');
    card.style.cssText = `
      width:220px;border-radius:12px;overflow:hidden;
      background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);
      box-shadow:0 4px 15px rgba(0,0,0,0.1);padding:10px;
      transition:transform .3s;
    `;
    card.onmouseover = () => card.style.transform = 'translateY(-4px)';
    card.onmouseout = () => card.style.transform = 'translateY(0)';

    card.innerHTML = `
      <a href="${post.link}" style="text-decoration:none;color:inherit;display:block;">
        <h4 style="font-size:14px;margin-bottom:5px;text-align:center;">${post.title}</h4>
        <p style="font-size:12px;color:#666;text-align:center;">${post.summary}</p>
      </a>
    `;
    container.appendChild(card);
  });
})();
</script>
