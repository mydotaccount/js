// 🔧 تنظیمات
const MAX_RELATED = 5;
const BLOG_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=100';

// 🧠 تابع اصلی
(async () => {
  try {
    const metaPostId = document.querySelector('meta[name="postId"]')?.content;
    console.log("meta postId:", metaPostId);
    if (!metaPostId) return console.warn("⚠️ meta postId یافت نشد.");

    // واکشی فید
    const res = await fetch(BLOG_URL);
    const data = await res.json();
    const posts = data.feed.entry;
    if (!posts) return console.warn("⚠️ هیچ پستی در فید یافت نشد.");

    // پیدا کردن پست فعلی
    const currentPost = posts.find(p => p.id.$t.includes(metaPostId));
    if (!currentPost) return console.warn("⚠️ پست جاری در فید پیدا نشد.");

    // استخراج برچسب‌ها از category یا مسیرهای جایگزین
    let currentLabels = [];
    if (currentPost.category) {
      currentLabels = currentPost.category.map(c => c.term.trim());
    } else if (currentPost["category$term"]) {
      currentLabels = [currentPost["category$term"]];
    } else if (currentPost.title?.$t?.includes("#")) {
      currentLabels = currentPost.title.$t.match(/#([\p{L}\d_-]+)/gu)?.map(t => t.replace("#", "")) || [];
    }

    console.log("🏷️ برچسب‌های پست فعلی:", currentLabels);
    if (currentLabels.length === 0) return console.warn("⚠️ پست جاری برچسب ندارد.");

    // پست‌های مرتبط
    const related = posts.filter(p => {
      if (p.id.$t.includes(metaPostId)) return false;
      const labels = p.category?.map(c => c.term.trim()) || [];
      return labels.some(lbl => currentLabels.includes(lbl));
    }).slice(0, MAX_RELATED);

    console.log(`✅ ${related.length} پست مرتبط پیدا شد`);

    if (related.length === 0) return;

    // 📦 نمایش بخش مطالب مرتبط
    const container = document.getElementById('related-posts');
    container.innerHTML = `
      <h3 style="
        font-size: 1.2rem;
        font-weight: bold;
        color: #fff;
        margin: 0 0 15px 0;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        padding-bottom: 6px;
        display: inline-block;
      ">📚 مطالب مرتبط</h3>
      <div id="related-wrapper" style="
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      "></div>
    `;

    const wrapper = container.querySelector("#related-wrapper");

    related.forEach(post => {
      const title = post.title.$t;
      const link = post.link.find(l => l.rel === 'alternate')?.href;
      const summary = post.summary ? post.summary.$t.substring(0, 80) + '...' : '';

      const card = document.createElement('div');
      card.style.cssText = `
        flex: 1 1 calc(50% - 10px);
        background: rgba(255,255,255,0.07);
        border-radius: 10px;
        padding: 12px 15px;
        transition: all 0.3s ease;
        min-width: 220px;
      `;
      card.onmouseover = () => card.style.background = "rgba(255,255,255,0.15)";
      card.onmouseout = () => card.style.background = "rgba(255,255,255,0.07)";

      card.innerHTML = `
        <a href="${link}" style="text-decoration:none;color:inherit;display:block;">
          <strong style="display:block;font-size:0.95rem;margin-bottom:6px;color:#fff;">${title}</strong>
          <p style="font-size:13px;color:#bbb;margin:0;">${summary}</p>
        </a>
      `;
      wrapper.appendChild(card);
    });

  } catch (err) {
    console.error("❌ خطا در واکشی پست‌ها:", err);
  }
})();
