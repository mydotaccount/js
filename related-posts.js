// 🔧 تنظیمات
const MAX_RELATED = 5;
const BLOG_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=100';

// 🌗 تشخیص حالت تیره یا روشن
function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initRelatedPosts() {
  (async () => {
    try {
      const metaPostId = document.querySelector('meta[name="postId"]')?.content;
      if (!metaPostId) return;

      const res = await fetch(BLOG_URL);
      const data = await res.json();
      const posts = data.feed.entry;
      if (!posts) return;

      const currentPost = posts.find(p => p.id.$t.includes(metaPostId));
      if (!currentPost) return;

      const currentLabels = currentPost.category?.map(c => c.term.trim()) || [];
      if (currentLabels.length === 0) return;

      const related = posts.filter(p => {
        if (p.id.$t.includes(metaPostId)) return false;
        const labels = p.category?.map(c => c.term.trim()) || [];
        return labels.some(lbl => currentLabels.includes(lbl));
      }).slice(0, MAX_RELATED);

      if (related.length === 0) return;

      const dark = isDarkMode();
      const textColor = dark ? "#eaeaea" : "#222";
      const subColor = dark ? "#999" : "#555";
      const borderColor = dark ? "#444" : "#ddd";

      const container = document.getElementById('related-posts');
      container.innerHTML = `
        <div style="margin-top:40px;border-top:1px solid ${borderColor};padding-top:15px;">
          <h3 style="
            font-size:1.1rem;
            font-weight:600;
            color:${textColor};
            margin-bottom:10px;
            letter-spacing:0.2px;
          ">مطالب مرتبط</h3>
          <ul id="related-list" style="list-style:none;padding:0;margin:0;"></ul>
        </div>
      `;

      const list = container.querySelector('#related-list');

      related.forEach(post => {
        const title = post.title.$t;
        const link = post.link.find(l => l.rel === 'alternate')?.href;
        const summary = post.summary ? post.summary.$t.substring(0, 80) + '...' : '';

        const li = document.createElement('li');
        li.style.cssText = `
          margin-bottom:10px;
          line-height:1.6;
          border-bottom:1px dashed ${borderColor};
          padding-bottom:6px;
        `;

        li.innerHTML = `
          <a href="${link}" style="
            color:${textColor};
            font-weight:500;
            text-decoration:none;
            transition:color 0.3s;
          ">${title}</a>
          <div style="font-size:13px;color:${subColor};margin-top:3px;">
            ${summary}
          </div>
        `;

        li.querySelector('a').onmouseover = () => li.querySelector('a').style.color = dark ? '#fff' : '#000';
        li.querySelector('a').onmouseout = () => li.querySelector('a').style.color = textColor;

        list.appendChild(li);
      });

    } catch (err) {
      console.error("❌ خطا در واکشی پست‌ها:", err);
    }
  })();
}

// 📄 اجرا
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRelatedPosts);
} else {
  initRelatedPosts();
}



