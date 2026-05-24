import type { TooltipRenderProps, BeaconRenderProps } from 'react-joyride';

export function TutorialTooltip({ 
  index, 
  step, 
  backProps, 
  primaryProps, 
  skipProps, 
  isLastStep 
}: TooltipRenderProps) { 
  if (index === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 max-w-sm mx-auto flex flex-col items-center gap-6 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <span className="text-3xl text-white">🎓</span>
        </div>

        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          ¡Bienvenido!
        </h2>

        <p className="text-sm md:text-base text-slate-500 leading-relaxed px-2">
          Te mostramos un rápido tutorial para que saques el máximo provecho al planificador académico.
        </p>

        <button
          {...primaryProps}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all text-base tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ¡Comencemos!
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-5 max-w-xs flex flex-col gap-3">
      {step.title && <h3 className="font-bold text-slate-800 text-base">{step.title as React.ReactNode}</h3>}
      <div className="text-sm text-slate-600 leading-relaxed">{step.content as React.ReactNode}</div>
      <div className="flex justify-between items-center gap-4 mt-2">
        {index > 0 && (
          <button {...backProps} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded">
            Atrás
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button {...skipProps} className="text-xs font-semibold text-slate-400 hover:text-slate-500 px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded">
            Omitir
          </button>
          <button {...primaryProps} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            {isLastStep ? "Finalizar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomBeacon(props: BeaconRenderProps) { 
  return (
    <button
      {...props}
      type="button"
      className="relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-2 rounded-md shadow-sm transition-all transform active:scale-95 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="absolute inline-flex h-full w-full rounded-md bg-blue-400 opacity-20 animate-ping top-0 left-0 -z-10"></span>
      <span>Reanudar Tutorial</span>
    </button>
  );
}