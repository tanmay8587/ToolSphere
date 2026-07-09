export default function ToolGallery({ tool }) {
  // Only use gallery array, never include coverImage or screenshots
  const galleryImages = tool?.gallery || [];

  // Only render if there are at least 2 gallery images
  if (!galleryImages || galleryImages.length < 2) return null;

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/400x224?text=Image+Error";
  };

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Gallery
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryImages.map((image, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800"
          >
            <img
              src={image}
              alt={`${tool.name} screenshot ${index + 1}`}
              className="h-56 w-full object-cover transition duration-300 hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}