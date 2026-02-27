"use client";

export const DEFAULT_OPTION_1 = "• Pauschale € 380,-  (Lieferkosten, Inbetriebnahme, Einarbeitung)";
export const DEFAULT_OPTION_2 = "* 3 Monate mietfreie Startphase";
export const DEFAULT_OPTION_3 =
  "1 Starterpaket für 1000 Eis inkl. Becher / Waffeln kostenlos";

export type OptionsData = {
  option1: string;
  option2: string;
  option3: string;
};

export const defaultOptions: OptionsData = {
  option1: DEFAULT_OPTION_1,
  option2: DEFAULT_OPTION_2,
  option3: DEFAULT_OPTION_3,
};

type Props = {
  options: OptionsData;
  onOptionsChange: (options: OptionsData) => void;
};

export function OptionsSection({ options, onOptionsChange }: Props) {
  const update = (key: keyof OptionsData, value: string) => {
    onOptionsChange({ ...options, [key]: value });
  };

  return (
    <section className="mb-8 text-sm text-stone-700">
      <h2 className="mb-2 font-bold text-stone-800">Optionen:</h2>
      <div className="space-y-0 border-t border-stone-200 pt-3">
        <label className="block border-b border-stone-200 py-2">
          <input
            type="text"
            value={options.option1}
            onChange={(e) => update("option1", e.target.value)}
            placeholder={DEFAULT_OPTION_1}
            className="w-full border-0 bg-transparent px-0 py-0.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0 focus:bg-stone-50"
          />
        </label>
        <label className="block border-b border-stone-200 py-2">
          <input
            type="text"
            value={options.option2}
            onChange={(e) => update("option2", e.target.value)}
            placeholder={DEFAULT_OPTION_2}
            className="w-full border-0 bg-transparent px-0 py-0.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0 focus:bg-stone-50"
          />
        </label>
        <label className="block border-b border-stone-200 py-2">
          <input
            type="text"
            value={options.option3}
            onChange={(e) => update("option3", e.target.value)}
            placeholder={DEFAULT_OPTION_3}
            className="w-full border-0 bg-transparent px-0 py-0.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0 focus:bg-stone-50"
          />
        </label>
      </div>
    </section>
  );
}
