<script>
(async function() {
  const MAX_RELATED = 4;
  const DEFAULT_IMAGE = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhcTov6t0hVhMF474104dGF3NFszcXVqCjPYF7Q_e1denvwchAz5a68RZxQlxrsobc6GmG6LG9tGFUn-Pz9_4jPtefQ9gflgFfXfQwt9vDlXc9gMvdx9bYIj9Or9IceYMPrI845m3MDysU9KuA_pyyspu2BOvp3PMKfa4eHzzssAg4GRUtH0IgSzLpMmrIS/s120/noghteh18-txtonly.png';

  const currentTitle = document.querySelector('h1.post-title, h3.post-title')?.innerText?.trim() || '';
  const currentLabels = Array.from(document.querySelectorAll('.post-labels a, a[rel="tag"]')).map(a => a.innerText.trim()).filter(Boolean);
  const currentUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

  // محل درج
  let container = document.getElementById('related-posts');
  if (!container) {
    const wrap = document.createElement('div');
    wrap.id = 'related-posts-container';
    wrap.innerHTML = `<h3 style="font-family:sans-serif;">مطالب مرتبط</h3><div id="related-posts" style="display:flex;flex-wrap:wrap;gap:15px;"></div>`;
    document.querySelector('.post-body, article, .entry-content')?.appendChild(wrap);
    container = wrap.querySelector('#related-posts');
  }

  // اگر برچسب دارد، از اولین برچسب فید خاص آن را بگیر
  let feedUrl;
  if (currentLabels.length) {
    const labelSlug = encodeURIComponent(currentLabels[0]);
    feedUrl = `${window.location.origin}/feeds/posts/default/-/${labelSlug}?alt=json&max-results=20`;
  } else {
    feedUrl = `${window.location.origin}/feeds/posts/default?alt=json&max-results=50`;
  }

  try {
    const res = await fetch(feedUrl);
    const data = await res.json();
    const entries = data.feed.entry || [];
    const related = [];

    for (let e of entries) {
      const link = e.link.find(l => l.rel === 'alternate')?.href;
      const title = e.title?.$t || '';
      if (!link || link === currentUrl || title === currentTitle) continue;

      const img = e.media$thumbnail ? e.media$thumbnail.url.replace('/s72-c/', '/s180-c/') : DEFAULT_IMAGE;
      const summary = e.summary ? e.summary.$t.replace(/<[^>]+>/g, '').substring(0, 70) + '...' : '';
      related.push({ title, link, img, summary });
    }

    if (!related.length) return;

    // اگر بیشتر از MAX_RELATED بود، تصادفی انتخاب کن
    const shuffled = related.sort(() => 0.5 - Math.random()).slice(0, MAX_RELATED);

    shuffled.forEach(post => {
      const card = document.createElement('div');
      card.style.cssText = `
        width:180px;border-radius:12px;overflow:hidden;
        background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);
        box-shadow:0 4px 15px rgba(0,0,0,0.1);transition:transform .3s;
      `;
      card.onmouseover = () => card.style.transform = 'translateY(-5px)';
      card.onmouseout = () => card.style.transform = 'translateY(0)';
      card.innerHTML = `
        <a href="${post.link}" style="text-decoration:none;color:inherit;display:block;">
          <img src="${post.img}" alt="${post.title}" style="width:100%;height:120px;object-fit:cover;">
          <h4 style="font-size:14px;margin:5px;text-align:center;">${post.title}</h4>
          <p style="font-size:12px;color:#666;margin:0 5px 10px;text-align:center;">${post.summary}</p>
        </a>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching related posts:', err);
  }
})();
</script>

