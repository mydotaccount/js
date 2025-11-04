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

    const labels = e
