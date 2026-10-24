import { CheckBand } from './_landing/check-band';
import { SiteNav } from './_landing/site-nav';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col pt-12">
        <div className="px-gutter">
          <h1 className="max-w-[16ch] font-display text-display font-extrabold font-stretch-expanded text-balance">
            Work letters that prove themselves.
          </h1>
          <p className="mt-6 max-w-[45ch] text-title">
            Employers issue. You share one fact at a time. Anyone can check it in seconds.
          </p>
        </div>
        <CheckBand />
      </main>
    </>
  );
}
