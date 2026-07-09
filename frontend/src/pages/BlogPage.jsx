const posts = [
  {
    title: 'The best AI tools for founders in 2026',
    excerpt: 'A practical roundup of AI platforms every startup team should evaluate.',
    category: 'Insights'
  },
  {
    title: 'How to choose the right AI tool for your stack',
    excerpt: 'A framework for comparing features, pricing, and product fit.',
    category: 'Guide'
  }
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">Blog</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Fresh insights on AI products</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {posts.map((post) => (
          <article key={post.title} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{post.category}</p>
            <h2 className="mt-3 text-2xl font-semibold">{post.title}</h2>
            <p className="mt-3 text-sm text-slate-400">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
