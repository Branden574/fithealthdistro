'use client';

// Sample text on this page is for checking motion in development only. It is not storefront copy.
import { useState } from 'react';
import { Accordion, Alert, Button, Chip, Dialog, ProductCard, Switch, Tabs } from '@ds';
import { RevealObserver } from '@/components/motion/RevealObserver';

const ITEMS = [
  {
    id: 'a',
    title: 'Sample question with a two-paragraph answer',
    content: (
      <>
        <p>First paragraph of a sample answer. It wraps across more than one line so the open and close can be judged on a real block of text.</p>
        <p>Second paragraph, to check paragraph spacing inside an answer.</p>
      </>
    ),
  },
  { id: 'b', title: 'Sample question two', content: <p>A one-line sample answer.</p> },
  { id: 'c', title: 'Sample question three, with a long title that wraps on a phone screen', content: <p>Another sample answer.</p> },
];

export function MotionLab() {
  const [dialog, setDialog] = useState(false);
  const [picked, setPicked] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sent, setSent] = useState(false);
  const [on, setOn] = useState(true);
  return (
    <main className="wrap" style={{ paddingBlock: 'var(--space-12)', display: 'grid', gap: 'var(--space-12)' }}>
      <header className="fhd-enter">
        <p className="eyebrow">Development</p>
        <h1 className="display-lg" style={{ margin: 0 }}>
          Motion lab
        </h1>
      </header>

      <section className="fhd-enter fhd-enter-1" aria-label="Accordion">
        <h2 className="display-sm">Accordion</h2>
        <Accordion items={ITEMS} headingLevel={3} />
      </section>

      <section className="fhd-enter fhd-enter-2" aria-label="Controls" style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <h2 className="display-sm">Controls</h2>
        <div className="row" role="group" aria-label="Sample filter">
          {['all', 'one', 'two'].map((id) => (
            <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>
              {id}
            </Chip>
          ))}
        </div>
        <Tabs items={[{ id: 'x', label: 'First' }, { id: 'y', label: 'Second', count: 3 }, { id: 'z', label: 'Third' }]} ariaLabel="Sample tabs" />
        <Switch label="Sample switch" checked={on} onChange={(event) => setOn(event.target.checked)} />
        <div className="row">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="primary" onClick={() => setSent((v) => !v)}>
            Toggle alert
          </Button>
        </div>
        <div style={{ minHeight: 'var(--space-16)' }}>
          {sent ? (
            <Alert className="fhd-appear" tone="success" title="Sample success">
              The alert arrives with fhd-appear.
            </Alert>
          ) : null}
        </div>
      </section>

      <section aria-label="Product card" style={{ maxWidth: 'calc(var(--space-20) * 4)' }}>
        <ProductCard name="Sample product" category="Sample category" icon="lockers" description="Sample description." price={100} selected={picked} onInterest={() => setPicked((v) => !v)} />
      </section>

      {[1, 2, 3].map((n) => (
        <section key={n} data-reveal="" style={{ minHeight: '60vh', borderTop: 'var(--border-thick) solid var(--ink)', paddingTop: 'var(--space-6)' }}>
          <h2 className="display-md">Reveal section {n}</h2>
          <p>Fades in once the first time it scrolls into view.</p>
        </section>
      ))}

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Sample dialog"
        description="Opens with a short rise and closes quicker."
        footer={
          <>
            <Button onClick={() => setDialog(false)}>Close</Button>
            <Button variant="primary" onClick={() => setDialog(false)}>
              Confirm
            </Button>
          </>
        }
      />
      <RevealObserver />
    </main>
  );
}
