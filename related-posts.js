// related-posts.js (نسخه ارتقا یافته)
// اجرا پس از بارگذاری DOM
(function(){
  const MAX_RELATED = 4;
  const DEFAULT_IMAGE = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhcTov6t0hVhMF474104dGF3NFszcXVqCjPYF7Q_e1denvwchAz5a68RZxQlxrsobc6GmG6LG9tGFUn-Pz9_4jPtefQ9gflgFfXfQwt9vDlXc9gMvdx9bYIj9Or9IceYMPrI845m3MDysU9KuA_pyyspu2BOvp3PMKfa4eHzzssAg4GRUtH0IgSzLpMmrIS/s120/noghteh18-txtonly.png';
  const FEED_URL = window.location.origin + '/feeds/posts/default?alt=json&max-results=200';

  // helper ها
  const trimLower = s => (s||'').toString().trim().toLowerCase();
  const uniq = arr => Array.from(new Set(arr));
  const tokenize = s => (s||'').toString().toLowerCase().split(/[^0-9\u0600-\u06FFa-zA-Z]+/).filter(Boolean);

  // پیدا کردن کانتینر برای قرار دادن related posts
  function findPostBody(){
    const selectors = [
      'article', '.post-body', '.post-content', '.entry-content', '.post', '.post-inner', '.blog-post'
    ];
    for (let sel of selectors){
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // fallback: body
    return document.body;
  }

  // گرفتن عنوان پست فعلی
  function getCurrentTitle(){
    const titleSelectors = ['h1.post-title','h1.entry-title','h3.post-title','.post-title','h1','title'];
    for (let s of titleSelectors){
      const el = document.querySelector(s);
      if (el && el.innerText && el.innerText.trim().length>0){
        // اگر انتخاب title تگ صفحه را گرفتیم، ممکن است شامل نام سایت باشد -> پر کوتاه
        return el.tagName.toLowerCase()==='title' ? document.title.replace(/[-|—].*$/,'').trim() : el.innerText.trim();
      }
    }
    return document.title || '';
  }

  // گرفتن لینک/شناسه پست فعلی (canonical یا location)
  function getCurrentPostUrl(){
    const can = document.querySelector("link[rel='canonical']");
    if (can && can.href) return can.href.split('#')[0];
    return window.location.href.split('#')[0];
  }

  // خواندن برچسب‌های پست فعلی از انواع سلکتورها
  function getCurrentLabels(){
    const selectors = ["a[rel='tag']", ".post-labels a", ".labels a", ".post-meta a[href*='/search/label/']", ".tags a"];
    let labels = [];
    selectors.forEach(sel=>{
      document.querySelectorAll(sel).forEach(a=>{
        if (a.innerText) labels.push(trimLower(a.innerText));
      });
    });
    // همچنین بررسی meta keywords اگر وجود داشت
    const meta = document.querySelector("meta[name='keywords']");
    if (meta && meta.content) meta.content.split(',').forEach(k=> labels.push(trimLower(k)));
    labels = labels.filter(Boolean).map(s=>s.replace(/\s+/g,' '));
    return uniq(labels);
  }

  // ساخت کانتینر و استایل اگر موجود نبود
  function ensureContainer(){
    let wrapper = document.getElementById('related-posts-container');
    if (wrapper) return wrapper;
    wrapper = document.createElement('div');
    wrapper.id = 'related-posts-container';
    wrapper.style.marginTop = '40px';
    wrapper.innerHTML = `<h3 style="font-family:sans-serif;margin-bottom:12px;">مطالب مرتبط</h3><div id="related-posts" style="display:flex;flex-wrap:wrap;gap:15px;"></div>`;
    const postBody = findPostBody();
    // سعی می‌کنیم زیر محتوای پست قرار دهیم: اگر postBody شامل عنصر main post هست، append، وگرنه انتهای body
    postBody.appendChild(wrapper);
    // استایل کلی کارت‌ها
    const style = document.createElement('style');
    style.innerHTML = `
      #related-posts .rp-card{
        width:180px;border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.06);backdrop-filter: blur(6px);box-shadow:0 6px 18px rgba(0,0,0,0.08);transition:transform .28s;display:block;
      }
      #related-posts .rp-card:hover{transform:translateY(-6px)}
      #related-posts .rp-card img{width:100%;height:120px;object-fit:cover;border-bottom:1px solid rgba(0,0,0,0.06)}
      #related-posts .rp-title{font-size:14px;margin:8px 6px 4px;text-align:center;color:inherit}
      #related-posts .rp-summary{font-size:12px;color:#555;margin:0 6px 10px;text-align:center}
      @media (max-width:768px){ #related-posts .rp-card{width:calc(50% - 10px)} }
      @media (max-width:480px){ #related-posts .rp-card{width:100%} }
    `;
    document.head.appendChild(style);
    return wrapper;
  }

  // نمره دهی پست با توجه به برچسب و تشابه عنوان
  function scoreEntry(entryLabels, entryTitleTokens, currentLabels, currentTitleTokens){
    let score = 0;
    // برچسب‌ها: هر برچسب مشترک 10 امتیاز
    if (entryLabels && entryLabels.length && currentLabels && currentLabels.length){
      const commonLabels = entryLabels.map(l=>trimLower(l)).filter(l=> currentLabels.includes(trimLower(l)));
      score += commonLabels.length * 10;
    }
    // تشابه عنوان: تعداد توکن‌های مشترک *2
    const commonTokens = entryTitleTokens.filter(t => currentTitleTokens.includes(t));
    score += commonTokens.length * 2;
    return score;
  }

  // normalize لینک (حذف پارامترها)
  function normalizeUrl(u){
    try{
      const url = new URL(u, window.location.origin);
      url.search = '';
      url.hash = '';
      return url.href;
    }catch(e){ return u; }
  }

  // اصلی: fetch فید و پردازش
  function run(){
    const currentTitle = getCurrentTitle();
    const currentUrl = normalizeUrl(getCurrentPostUrl());
    const currentLabels = getCurrentLabels().map(l=>trimLower(l));
    const currentTitleTokens = uniq(tokenize(currentTitle));

    // اگر نه عنوان و نه برچسب داریم، از عنوان صفحه استفاده کن و ادامه بده
    // fetch feed
    fetch(FEED_URL).then(r=>r.json()).then(data=>{
      const entries = (data.feed && data.feed.entry) ? data.feed.entry : [];
      if (!entries.length) return;
      // map entries to objects
      const mapped = entries.map(e=>{
        const title = e.title && e.title.$t ? e.title.$t : '';
        const links = e.link || [];
        const alternate = links.find(l=>l.rel==='alternate');
        const link = alternate ? alternate.href : (e.id && e.id.$t ? e.id.$t : '');
        const normLink = normalizeUrl(link);
        // labels from entry.category (can be array or object)
        let labels = [];
        if (e.category){
          if (Array.isArray(e.category)) labels = e.category.map(c=> c.term || c.$t || '');
          else if (e.category.term) labels = [e.category.term];
        }
        // summary maybe e.summary.$t or e.content.$t
        const summary = (e.summary && e.summary.$t) ? e.summary.$t : ((e.content && e.content.$t) ? e.content.$t : '');
        // published date
        const published = e.published ? e.published.$t : (e.updated ? e.updated.$t : '');
        return {
          title, link: normLink, rawLink: link, labels: labels.map(l=>trimLower(l)), summary, published
        };
      });

      // filter out current post by URL or exact title
      const candidates = mapped.filter(m => m.link !== currentUrl && trimLower(m.title)!==trimLower(currentTitle));

      // score هر کدام
      const scored = candidates.map(c=>{
        const titleTokens = uniq(tokenize(c.title));
        const s = scoreEntry(c.labels, titleTokens, currentLabels, currentTitleTokens);
        // اگر هیچ برچسبی نداریم و score==0، اضافه نمره جزئی بر اساس عنوان (1 امتیاز به ازای هر توکن مشترک)
        let finalScore = s;
        if ((!currentLabels.length || !c.labels.length) && s===0){
          const common = titleTokens.filter(t => currentTitleTokens.includes(t)).length;
          finalScore = common; // کوچک اما مفید
        }
        return Object.assign({}, c, {score: finalScore});
      });

      // مرتب سازی بر اساس score سپس تاریخ (جدیدتر اول)
      scored.sort((a,b)=>{
        if (b.score !== a.score) return b.score - a.score;
        return (new Date(b.published) - new Date(a.published));
      });

      // فیلتر: اگر score==0 (کاملاً بی‌ربط) حذف شوند
      const filtered = scored.filter(x => x.score>0).slice(0, MAX_RELATED);

      // اگر چیزی نداشتیم (fallback)، در نظر بگیر تا چند مورد پایین‌تر با حداقل تشابه عنوان
      let finalList = filtered;
      if (finalList.length < MAX_RELATED){
        const need = MAX_RELATED - finalList.length;
        const extras = scored.filter(x => x.score===0).slice(0, need);
        finalList = finalList.concat(extras);
      }

      // رندر
      const wrapper = ensureContainer();
      const container = wrapper.querySelector('#related-posts');
      if (!container) return;
      container.innerHTML = ''; // پاکسازی قبلی
      finalList.forEach(item=>{
        const img = item.summary && item.summary.match(/<img[^>]+src=['"]([^'"]+)['"]/i) ? RegExp.$1 : DEFAULT_IMAGE;
        const short = item.summary ? item.summary.replace(/<[^>]+>/g,'').substring(0,60) + '...' : '';
        const card = document.createElement('div');
        card.className = 'rp-card';
        card.innerHTML = `
          <a href="${item.link}" style="text-decoration:none;color:inherit;display:block;">
            <img src="${img}" alt="${item.title}">
            <div class="rp-title">${item.title}</div>
            <div class="rp-summary">${short}</div>
          </a>
        `;
        container.appendChild(card);
      });

    }).catch(err=>{
      console.error('Related posts fetch error:', err);
    });
  }

  // اجرا زمانی که DOM آماده شد (و اگر محتوای پست دیر لود شد، بعد از 600ms هم تلاش مجدد)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  // یک بار هم بعد از 600ms اجرا کن چون بعضی قالب‌ها محتوای پست را دیر قرار می‌دهند
  setTimeout(run, 600);
})();
