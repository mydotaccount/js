// related-posts.js – نسخه شیک و مدرن

const MAX_RELATED = 5;
const BLOG_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=50';

(async () => {
  try {
    const res = await fetch(BLOG_URL);
    const data = await res.json();

    const posts = data.feed.entry;
    if (!posts) return console.warn("⚠️ هیچ پستی یافت نشد.");

    const currentTitle = document.querySelector('h1.post-title, h3.post-title')?.innerText.trim() || '';
    const currentUrl = window.location.href;
    const currentPost = posts.find(p => currentUrl.includes(p.link.find(l => l.rel === 'alternate')?.href.split('/').pop()));
    if (!currentPost || !currentPost.category) return console.warn("⚠️ پست جاری برچسب ندارد.");

    const currentLabels = currentPost.category.map(c => c.term.trim());
    console.log("🏷️ برچسب‌های پست فعلی:", currentLabels);

    const related = posts.filter(p => {
      if (!p.category) return false;
      const labels = p.category.map(c => c.term.trim());
      const hasCommon = labels.some(lbl => currentLabels.includes(lbl));
      const link = p.link.find(l => l.rel === 'alternate')?.href;
      return hasCommon && link !== currentUrl;
    }).slice(0, MAX_RELATED);

    console.log(`✅ ${related.length} پست مرتبط پیدا شد`);

    if (related.length === 0) return;

    // کانتینر اصلی
    const container = document.getElementById('related-posts');
    if (!container) return console.warn("⚠️ المنت #related-posts پیدا نشد.");

    f (related.length <= 2) {
      container.style.justifyContent = 'center';
    } else {
      container.style.justifyContent = 'flex-start';
    }
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '15px';
    container.style.marginTop = '15px';

    related.forEach(post => {
      const title = post.title.$t;
      const link = post.link.find(l => l.rel === 'alternate')?.href;
      const summary = post.summary ? post.summary.$t.substring(0, 80) + '...' : '';

      const card = document.createElement('div');
      card.style.cssText = `
        flex: 1 1 180px;
        padding: 12px;
        background: rgba(255,255,255,0.07);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
      `;
      card.onmouseover = () => {
        card.style.transform = "translateY(-5px)";
        card.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
        card.style.background = "rgba(255,255,255,0.12)";
      };
      card.onmouseout = () => {
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        card.style.background = "rgba(255,255,255,0.07)";
      };

      card.innerHTML = `
        <a href="${link}" style="text-decoration:none;color:inherit;display:block;">
          <strong style="display:block;margin-bottom:6px;">${title}</strong>
          <p style="font-size:13px;color:#bbb;margin:0;">${summary}</p>
        </a>
      `;

      container.appendChild(card);
    });

    // ریسپانسیو
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width:768px){
        #related-posts div { flex: 1 1 calc(50% - 10px); }
      }
      @media (max-width:480px){
        #related-posts div { flex: 1 1 100%; }
      }
    `;
    document.head.appendChild(style);

  } catch (err) {
    console.error("❌ خطا در واکشی پست‌ها:", err);
  }
})();
