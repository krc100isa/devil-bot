export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Casino Growth & Operations Platform
        </p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Risk sinyalleri, erken uyarı ve operasyonel kontrol tek panelde.
        </h1>
        <p className="text-base text-slate-300 md:text-lg">
          Site uptime, domain güvenliği, sosyal medya performansı ve SEO kalite
          kontrollerini org seviyesinde yönetin.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Website & Domain Intelligence",
            description:
              "Site down, SSL expiry ve WHOIS değişimlerini merkezi alert akışıyla izleyin."
          },
          {
            title: "Social Media Intelligence",
            description:
              "İçerik kuyruğu, format performansı ve hashtag risk sinyalleriyle planlı büyüme."
          },
          {
            title: "SEO Intelligence (White-hat)",
            description:
              "Kendi URL'lerinizde title/meta/headings/canonical kontrolleri ve aksiyon önerileri."
          },
          {
            title: "Telegram Ops & Team Control",
            description:
              "Role-aware bot menüleri, ack/resolve ve vardiya bazlı escalation akışları."
          }
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="text-xl font-semibold text-slate-100">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold">Yaklaşan Adımlar</h3>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>Auth + org izolasyonu tamamlanacak.</li>
          <li>Monitoring, incident grouping ve alert routing devreye alınacak.</li>
          <li>Telegram bot shift + KPI modülleri eklenecek.</li>
        </ul>
      </section>
    </main>
  );
}
