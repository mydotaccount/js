
// 🔧 تنظیمات
const MAX_RELATED = 5;
const BLOG_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=50';

// 🧠 تابع اصلی
(async () => {
  try {
    const res = await fetch(BLOG_URL);
    const data = await res.json();

    const posts = data.feed.entry;
    if (!posts) return console.warn("⚠️ هیچ پستی یافت نشد.");

    // 🔹 پست فعلی
    const currentTitle = document.querySelector('h1.post-title, h3.post-title')?.innerText.trim() || '';
    const currentUrl = window.location.href;
    const currentPost = posts.find(p => currentUrl.includes(p.link.find(l => l.rel === 'alternate')?.href.split('/').pop()));
    if (!currentPost || !currentPost.category) return console.warn("⚠️ پست جاری برچسب ندارد.");

    const currentLabels = currentPost.category.map(c => c.term.trim());

    console.log("🏷️ برچسب‌های پست فعلی:", currentLabels);

    // 🔹 پیدا کردن پست‌های مرتبط (بر اساس تطابق دقیق یکی از برچسب‌ها)
    const related = posts.filter(p => {
      if (!p.category) return false;
      const labels = p.category.map(c => c.term.trim());
      const hasCommon = labels.some(lbl => currentLabels.includes(lbl));
      const link = p.link.find(l => l.rel === 'alternate')?.href;
      return hasCommon && link !== currentUrl;
    }).slice(0, MAX_RELATED);

    console.log(`✅ ${related.length} پست مرتبط پیدا شد`);

    if (related.length === 0) return;

    // 🔹 نمایش در صفحه
    const container = document.getElementById('related-posts');
    related.forEach(post => {
      const title = post.title.$t;
      const link = post.link.find(l => l.rel === 'alternate')?.href;
      const summary = post.summary ? post.summary.$t.substring(0, 80) + '...' : '';

      const card = document.createElement('div');
      card.style.cssText = `
        padding:10px 15px;
        margin-bottom:8px;
        background:rgba(255,255,255,0.07);
        border-radius:8px;
        transition:background 0.3s;
      `;
      card.onmouseover = () => card.style.background = "rgba(255,255,255,0.15)";
      card.onmouseout = () => card.style.background = "rgba(255,255,255,0.07)";

      card.innerHTML = `
        <a href="${link}" style="text-decoration:none;color:inherit;display:block;">
          <strong>${title}</strong>
          <p style="font-size:13px;color:#bbb;margin:4px 0 0;">${summary}</p>
        </a>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("❌ خطا در واکشی پست‌ها:", err);
  }
})();
