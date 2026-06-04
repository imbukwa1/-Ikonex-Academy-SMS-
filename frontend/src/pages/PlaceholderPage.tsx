type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-academy-700">Ikonex SMS</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm leading-6 text-slate-600">
          This route is ready for the next frontend slice: tables, forms,
          assessment entry, ranking views, and PDF report templates.
        </p>
      </div>
    </section>
  );
}
