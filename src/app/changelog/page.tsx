import {
  changelogEntries,
  formatChangelogDate,
} from "@/lib/changelog";

const ChangelogPage = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Changelog</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Product updates, improvements, and fixes for Stalq Lite.
        </p>
      </div>

      <div className="space-y-14">
        {changelogEntries.map((entry) => (
          <article key={entry.version} className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">
                <span>v{entry.version}</span>
                <span className="mx-1.5 text-zinc-700">•</span>
                <time dateTime={entry.postedAt}>{formatChangelogDate(entry.postedAt)}</time>
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {entry.title}
              </h2>
              <p className="text-[15px] leading-relaxed text-zinc-400">{entry.summary}</p>
            </div>

            <div className="space-y-6">
              {entry.sections.map((section) => (
                <section key={section.heading} className="space-y-2.5">
                  <h3 className="text-base font-medium text-white">{section.heading}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 text-[15px] leading-relaxed text-zinc-400"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ChangelogPage;
