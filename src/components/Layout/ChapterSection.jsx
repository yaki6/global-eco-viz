export default function ChapterSection({ id, number, title, children }) {
  return (
    <section id={id} className="border-t border-gray-200 mt-8 pt-8">
      <div className="mb-8">
        <span className="text-gold font-heading text-sm uppercase tracking-wider">
          Chapter {number}
        </span>
        <h2 className="font-heading text-3xl text-navy mt-1">{title}</h2>
      </div>
      {children}
    </section>
  );
}
