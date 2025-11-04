// RELATED POSTS START

// ایجاد کانتینر اصلی اگر وجود نداشته باشد
if (!document.getElementById('related-posts-container')) {
  const containerWrapper = document.createElement('div');
  containerWrapper.id = 'related-posts-container';
  containerWrapper.style.marginTop = '40px';
  containerWrapper.innerHTML = `
    <h3 style="font-family:sans-serif;">مطالب مرتبط</h3>
    <div id="related-posts" style="display:flex; flex-wrap:wrap; gap:15px;"></div>
  `;
  // اضافه کردن به انتهای بدنه پست
  const postBody = document.querySelector('div.post-body, .post-body, .post-content');
  if (postBody) postBody.appendChild(containerWrapper);
}

// CSS داخلی
const style = document.createElement('style');
style.innerHTML = `
#related-posts div {
  width:180px;
  border-radius:12px;
  overflow:hidden;
  background:rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  box-shadow:0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  margin-bottom:10px;
}
#related-posts div:hover { transform: translateY(-5px); }
@media (max-width:768px){ #related-posts div { width: calc(50% - 10px); } }
@media (max-width:480px){ #related-posts div { width:100%; } }
`;
document.head.appendChild(style);

// تنظیمات
const MAX_RELATED = 4;
const DEFAULT_IMAGE = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhcTov6t0hVhMF474104dGF3NFszcXVqCjPYF7Q_e1denvwchAz5a68RZxQlxrsobc6GmG6LG9tGFUn-Pz9_4jPtefQ9gflgFfXfQwt9vDlXc9gMvdxYIj9Or9IceYMPrI845m3MDysU9KuA_pyyspu2BOvp3PMKfa4eHzzssAg4GRUtH0IgSzLpMmrIS/s120/noghteh18-txtonly.png';
const BLOG_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=50';

// fetch و اضافه کردن کارت‌ها
fetch(BLOG_URL)
  .then(res => res.json())
  .then(data => {
    const posts = data.feed.entry;
    if (!posts) return;
    const currentTitle = document.querySelector('h1.post-title, h3.post-title')?.innerText || '';
    let related = posts.filter(post => {
      const title = post.title.$t;
      return title !== currentTitle && title.includes(currentTitle.split(' ')[0]);
    }).slice(0, MAX_RELATED);

    const container = document.getElementById('related-posts');

    related.forEach(post => {
      const title = post.title.$t;
      const link = post.link.find(l => l.rel==='alternate').href;
      const img = post.media$thumbnail ? post.media$thumbnail.url.replace('/s72-c/','/s180-c/') : DEFAULT_IMAGE;
      const summary = post.summary ? post.summary.$t.substring(0, 60) + '...' : '';

      const card = document.createElement('div');
      card.innerHTML = `
        <a href="${link}" style="text-decoration:none;color:inherit;display:block;">
          <img src="${img}" style="width:100%;height:120px;object-fit:cover;border-bottom:1px solid rgba(255,255,255,0.2);">
          <h4 style="font-size:14px;margin:5px;text-align:center;">${title}</h4>
          <p style="font-size:12px;color:#555;margin:0 5px 5px;text-align:center;">${summary}</p>
        </a>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error fetching related posts:', err));

// RELATED POSTS END
