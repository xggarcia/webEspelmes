'use client';

import { useState } from 'react';

type Labels = {
  name: string;
  email: string;
  message: string;
  send: string;
  thanks: string;
};

export function ContactForm({ labels }: { labels: Labels }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="card-warm text-sage">{labels.thanks}</p>;
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-ink outline-none focus:border-ember';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="card-warm space-y-4"
    >
      <label className="block text-sm">
        <span className="text-ink/70">{labels.name}</span>
        <input required className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.email}</span>
        <input required type="email" className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.message}</span>
        <textarea required rows={5} className={inputCls} />
      </label>
      <button type="submit" className="btn-primary w-full">
        {labels.send}
      </button>
    </form>
  );
}
