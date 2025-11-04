// 🔧 تنظیمات
const MAX_RELATED = 5;
const BLOG_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=100';

// 🌗 تابع تشخیص حالت تیره/روشن
function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initRelatedPosts() {
  (async () => {
    try {
      const metaPostId = document.querySelector('meta[name="postId"]')?.content;
      if (!metaPostId) return console.warn("⚠️ meta postId یافت نشد.");

      const res = await fetch(BLOG_URL);
      const data = await res.json();
      const posts = data.feed.entry;
      if (!posts) return console.warn("⚠️ هیچ پستی در فید یافت نشد.");

      const currentPost = posts.find(p => p.id.$t.includes(metaPostId));
      if (!currentPost) return console.warn("⚠️ پست جاری در فید پیدا نشد.");

      let currentLabels = [];
      if (currentPost.category) {
        currentLabels = currentPost.category.map(c => c.term.trim());
      }

      if (currentLabels.length === 0) return console.warn("⚠️ پست جاری برچسب ندارد.");

      const related = posts.filter(p => {
        if (p.id.$t.includes(metaPostId)) return false;
        const labels = p.category?.map(c => c.term.trim()) || [];
        return labels.some(lbl => currentLabels.includes(lbl));
      }).slice(0, MAX_RELATED);

      if (related.length === 0) return;

      const dark = isDarkMode();
      const textColor = dark ? "#f5f5f5" : "#222";
      const subText = dark ? "#bbb" : "#555";
      const cardBg = dark ? "rgba(255,255,255,0.05)" : "#f8f9fa";
      const cardHover = dark ? "rgba(255,255,255,0.1)" : "#f1f3f5";
      const borderColor = dark ? "rgba(255,255,255,0.1)" : "#e5e5e5";

      const container = document.getElementById('related-posts');
      if (!container) return console.warn("⚠️ عنصر related-posts یافت نشد.");

      container.innerHTML = `
        <h3 style="
          font-size: 1.2rem;
          font-weight: bold;
          color: ${textColor};
          margin: 0 0 15px 0;
          border-bottom: 1px solid ${borderColor};
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
          background: ${cardBg};
          border-radius: 10px;
          padding: 12px 15px;
          transition: all 0.3s ease;
          min-width: 220px;
          border: 1px solid ${borderColor};
        `;
        card.onmouseover = () => card.style.background = cardHover;
        card.onmouseout = () => card.style.background = cardBg;

        card.innerHTML = `
          <a href="${link}" style="text-decoration:none;color:${textColor};display:block;">
            <strong style="display:block;font-size:0.95rem;margin-bottom:6px;">${title}</strong>
            <p style="font-size:13px;color:${subText};margin:0;">${summary}</p>
          </a>
        `;
        wrapper.appendChild(card);
      });

    } catch (err) {
      console.error("❌ خطا در واکشی پست‌ها:", err);
    }
  })();
}

// 🕒 اجرای ایمن پس از لود DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const check = setInterval(() => {
      if (document.getElementById("related-posts")) {
        clearInterval(check);
        initRelatedPosts();
      }
    }, 200);
  });
} else {
  const check = setInterval(() => {
    if (document.getElementById("related-posts")) {
      clearInterval(check);
      initRelatedPosts();
    }
  }, 200);
}

