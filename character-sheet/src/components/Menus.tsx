import { useRef, useState } from 'react';
import { fx, perform, sound, centerOf } from '../fx';
import { ELEMENTS, type FxLevel, type Shape } from '../fx/types';
import type { Settings } from '../state/storage';
import { blankCharacter, normalizeCharacter, uid, type Character } from '../systems/dnd5e/model';
import { classSummary } from '../systems/dnd5e/rules';
import { sampleCharacter } from '../systems/dnd5e/sample';
import { Check, ConfirmButton, Dialog, SelectField } from './ui';

export function CharactersDialog(props: {
  characters: Character[];
  currentId: string;
  onSwitch: (id: string) => void;
  onAdd: (c: Character) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'list' | 'import' | 'export'>('list');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = props.characters.find((c) => c.id === props.currentId)!;
  const exportJson = JSON.stringify(current, null, 2);

  const importText = (raw: string) => {
    try {
      const c = normalizeCharacter(JSON.parse(raw));
      props.onAdd({ ...c, id: uid(), isExample: false, updatedAt: Date.now() });
      props.onClose();
    } catch (e) {
      setError(e instanceof SyntaxError ? 'That is not valid JSON. Paste the whole exported file.' : (e as Error).message);
    }
  };

  return (
    <Dialog title="Characters" onClose={props.onClose}>
      <div className="seg" role="group" aria-label="Character tools" style={{ marginBottom: 12 }}>
        {(['list', 'import', 'export'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => (setMode(m), setError(''))}>
            {m === 'list' ? 'My characters' : m === 'import' ? 'Import' : 'Export'}
          </button>
        ))}
      </div>

      {mode === 'list' && (
        <>
          <div className="lib">
            {props.characters.map((c) => (
              <div key={c.id} className="item" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, padding: '8px 10px', alignItems: 'center' }}>
                <button type="button" className="item-title" onClick={() => (props.onSwitch(c.id), props.onClose())}>
                  <b>
                    {c.name || 'Unnamed'}
                    {c.id === props.currentId ? ' · open' : ''}
                    {c.isExample ? ' · example' : ''}
                  </b>
                  <small>
                    {[c.species, classSummary(c)].filter(Boolean).join(' · ')}
                  </small>
                </button>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <button type="button" className="btn small ghost" onClick={() => props.onAdd({ ...structuredClone(c), id: uid(), name: `${c.name} (copy)`, isExample: false })}>
                    Copy
                  </button>
                  {props.characters.length > 1 && <ConfirmButton label="Delete" confirmLabel="Delete?" onConfirm={() => props.onDelete(c.id)} />}
                </div>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn primary" onClick={() => (props.onAdd(blankCharacter()), props.onClose())}>
              New character
            </button>
            <button type="button" className="btn" onClick={() => (props.onAdd(sampleCharacter()), props.onClose())}>
              New from the example
            </button>
          </div>
          <p className="hint">Characters are saved in this browser only. Export them to keep a backup or move them to another device.</p>
        </>
      )}

      {mode === 'import' && (
        <>
          <p className="hint">Choose an exported .json file, or paste its contents.</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            id="import-file"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) importText(await f.text());
            }}
          />
          <textarea className="input" style={{ marginTop: 10 }} id="import-text" aria-label="Character JSON" value={text} placeholder='{"name": "…"}' onChange={(e) => setText(e.target.value)} />
          {error && <p className="hint" style={{ color: 'var(--bad)' }}>{error}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn primary" disabled={!text.trim()} onClick={() => importText(text)}>
              Import
            </button>
          </div>
        </>
      )}

      {mode === 'export' && (
        <>
          <p className="hint">{current.name}: copy this text and keep it somewhere safe, or download it as a file.</p>
          <textarea className="input" readOnly id="export-text" aria-label="Exported character" value={exportJson} onFocus={(e) => e.currentTarget.select()} />
          <div className="row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                navigator.clipboard?.writeText(exportJson).then(
                  () => (setCopied(true), setTimeout(() => setCopied(false), 2000)),
                  () => (document.getElementById('export-text') as HTMLTextAreaElement | null)?.select(),
                );
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([exportJson], { type: 'application/json' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(current.name || 'character').replace(/[^\w-]+/g, '_')}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Download file
            </button>
          </div>
          <p className="hint">If Download does nothing (some embedded viewers block it), use Copy.</p>
        </>
      )}
    </Dialog>
  );
}

const SHOWCASE: { el: (typeof ELEMENTS)[number]['id']; shape: Shape; power: number }[] = [
  { el: 'fire', shape: 'burst', power: 3 },
  { el: 'lightning', shape: 'line', power: 3 },
  { el: 'cold', shape: 'ray', power: 1 },
  { el: 'thunder', shape: 'burst', power: 2 },
  { el: 'acid', shape: 'bolt', power: 1 },
  { el: 'poison', shape: 'cone', power: 1 },
  { el: 'necrotic', shape: 'touch', power: 2 },
  { el: 'radiant', shape: 'rain', power: 2 },
  { el: 'force', shape: 'bolt', power: 1 },
  { el: 'psychic', shape: 'bolt', power: 1 },
  { el: 'healing', shape: 'aura', power: 1 },
  { el: 'slashing', shape: 'touch', power: 0 },
  { el: 'piercing', shape: 'bolt', power: 0 },
  { el: 'bludgeoning', shape: 'touch', power: 0 },
  { el: 'arcane', shape: 'aura', power: 1 },
  { el: 'shadow', shape: 'cone', power: 1 },
  { el: 'nature', shape: 'burst', power: 1 },
];

export function SettingsDialog(props: { settings: Settings; onChange: (s: Settings) => void; onClose: () => void }) {
  const s = props.settings;
  const set = (patch: Partial<Settings>) => props.onChange({ ...s, ...patch });
  return (
    <Dialog title="Effects & sound" onClose={props.onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <SelectField<FxLevel>
          label="Animations"
          id="set-fx"
          value={s.fx}
          options={[
            { id: 'full', name: 'Full' },
            { id: 'reduced', name: 'Reduced (fewer particles, no shaking or flashes)' },
            { id: 'off', name: 'Off' },
          ]}
          onChange={(v) => set({ fx: v })}
        />
        <Check label="Allow screen flashes (lightning, big explosions)" id="set-flash" checked={s.flashes} onChange={(b) => set({ flashes: b })} />
        <p className="hint" style={{ margin: 0 }}>
          Flashes are limited to two per effect and kept dim, below the WCAG three-flashes-per-second threshold. Turn them off if bright flashes bother you.
        </p>
        <Check label="Sound effects" id="set-sound" checked={s.sound} onChange={(b) => set({ sound: b })} />
        <label className="field" htmlFor="set-volume">
          <span>Volume</span>
          <input id="set-volume" type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => set({ volume: Number(e.target.value) })} />
        </label>
        <SelectField
          label="Theme"
          id="set-theme"
          value={s.theme}
          options={[
            { id: 'system', name: 'Match my device' },
            { id: 'dark', name: 'Dark' },
            { id: 'light', name: 'Light' },
          ]}
          onChange={(v) => set({ theme: v })}
        />
        <h3 style={{ margin: 0 }}>Try every effect</h3>
        <div className="actions-grid">
          {SHOWCASE.map((x) => (
            <button
              key={x.el}
              type="button"
              className={`cast el-${x.el}`}
              onClick={(e) => {
                const from = centerOf(e.currentTarget);
                perform({ element: x.el, shape: x.shape, from, to: x.shape === 'touch' ? undefined : fx.defaultTarget(from), power: x.power, outcome: 'hit', label: ELEMENTS.find((q) => q.id === x.el)!.name });
              }}
            >
              {ELEMENTS.find((q) => q.id === x.el)!.name}
            </button>
          ))}
        </div>
        <button type="button" className="btn small ghost" onClick={() => sound.dice(3)}>
          Test dice sound
        </button>
      </div>
    </Dialog>
  );
}
