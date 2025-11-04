<script>
(async function() {
  const MAX_RELATED = 4;
  const currentTitle = document.querySelector('h1.post-title, h3.post-title')?.innerText?.trim() || '';
  const currentLabels = Array.from(document.querySelectorAll('.post-labels a, a[rel="tag"]'))
    .map(a => a.innerText.trim())
    .filter(Boolean);
  const currentUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

  console.log("🟢 عنوان فعلی:", currentTitle);
  console.log("🏷️ برچسب‌های فعلی:", currentLabels);

  if (!currentLabels.length) {
    console.warn("⛔ این پست هیچ برچسبی ندارد. بخش مطالب مرتبط نمایش داده نمی‌شود.");
    return;
  }

  const normalize = str => str
    .trim()
    .toLowerCase()
    .replace(/[يی]/g, "ی")
    .replace(/[كک]/g, "ک");

  const normalizedLabels = currentLabels.map(normalize);
  console.log("🟡 برچسب‌های نرمال‌شده:", normalizedLabels);

  const allPosts = [];

  // واکشی برای همه برچسب‌ها
  for (let lbl of normalizedLabels) {
    const feedUrl = `${window.location.origin}/feeds/posts/default/-/${encodeURIComponent(lbl)}?alt=json&max-results=30`;
    console.log(`📡 در حال واکشی فید برای برچسب: "${lbl}" → ${feedUrl}`);

    try {
      const res = await fetch(feedUrl);
      const data = await res.json();
      if (data.feed?.entry) {
        console.log(`✅ ${data.feed.entry.length} پست یافت شد برای "${lbl}"`);
        allPosts.push(...data.feed.entry);
      } else {
        console.warn(`⚠️ هیچ پستی برای "${lbl}" پیدا نشد`);
      }
    } catch (e) {
      console.error(`❌ خطا هنگام واکشی "${lbl}":`, e);
    }
  }

  console.log("📦 مجموع پست‌های جمع‌آوری‌شده:", allPosts.length);

  const unique = [];
  const linksSeen = new Set();

  for (const e of allPosts) {
    const link = e.link.find(l => l.rel === 'alternate')?.href;
    if (!link || linksSeen.has(link) || link === currentUrl) continue;
    linksSeen.add(link);

    const title = e.title?.$t || '';
    if (title === currentTitle) continue;

    const labels = e.category ? e.category.map(cat => normalize(cat.term)) : [];
    const hasExactMatch = labels.some(lbl => normalizedLabels.includes(lbl));
    if (!hasExactMatch) continue;

    const summary = e.summary ? e.summary.$t.replace(/<[^>]+>/g, '').substring(0, 90) + '...' : '';
    unique.push({ title, link, summary });
  }

  console.log("🎯 پست‌های مرتبط نهایی:", unique);

  if (!unique.length) {
    console.warn("⚠️ هیچ پست مرتبطی یافت نشد. ممکن است برچسب‌ها ناهماهنگ باشند.");
    return;
  }

  // ساخت بخش مطالب مرتبط
  const wrap = document.createElement('div');
  wrap.id = 'related-posts-container';
  wrap.innerHTML = `
    <h3 style="font-family:sans-serif;margin-top:40px;">مطالب مرتبط</h3>
    <div id="related-posts" style="display:flex;flex-wrap:wrap;gap:15px;"></div>
  `;
  document.querySelector('.post-body, article, .entry-content')?.appendChild(wrap);

  const container = wrap.querySelector('#related-posts');
  const shuffled = unique.sort(() => 0.5 - Math.random()).slice(0, MAX_RELATED);

  shuffled.forEach(post => {
    const card = document.createElement('div');
    card.style.cssText = `
      width:220px;border-radius:12px;overflow:hidden;
      background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);
      box-shadow:0 4px 15px rgba(0,0,0,0.1);
      padding:10px;transition:transform .3s;
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
