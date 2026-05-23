import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from "react-router-dom"
import { useAcademicStore } from "../store/academicStore"
import { useSimulationLogic } from "../hooks/useSimulationLogic"

import { Joyride } from 'react-joyride'
import type { Step } from 'react-joyride'

// Componentes
import { GraduationTimeline } from "./GraduationTimeline"
import { ChainReactionModal } from "./modals/ChainReactionModal"
import { PrereqNoticeModal } from "./modals/PrereqNoticeModal"
import { PartialSelectionModal } from "./modals/PartialSelectionModal"
import { SemesterGrid } from "./home/SemesterGrid"
import { SimulationSettings } from "./home/SimulationSettings"
import { PrioritySelector } from "./home/PrioritySelector"
import { QuickFillMenu } from "./home/QuickFillMenu"

// Logo
import logoAcacia from "../assets/logo.png"

const JoyrideComponent = Joyride as any;

function TutorialTooltip({ index, step, backProps, primaryProps, skipProps, isLastStep }: any) {
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
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all text-base tracking-wide outline-none focus:outline-none"
        >
          ¡Comencemos!
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-5 max-w-xs flex flex-col gap-3">
      {step.title && <h3 className="font-bold text-slate-800 text-base">{step.title}</h3>}
      <div className="text-sm text-slate-600 leading-relaxed">{step.content}</div>
      <div className="flex justify-between items-center gap-4 mt-2">
        {index > 0 && (
          <button {...backProps} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 outline-none focus:outline-none">
            Atrás
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button {...skipProps} className="text-xs font-semibold text-slate-400 hover:text-slate-500 px-2 py-1 outline-none focus:outline-none">
            Omitir
          </button>
          <button {...primaryProps} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm outline-none focus:outline-none">
            {isLastStep ? "Finalizar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomBeacon({ ...props }: any) {
  return (
    <button
      {...props}
      type="button"
      className="relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-2 rounded-md shadow-sm transition-all transform active:scale-95 group outline-none focus:outline-none"
    >
      {/* Efecto de pulso en el fondo para llamar la atención sutilmente */}
      <span className="absolute inline-flex h-full w-full rounded-md bg-blue-400 opacity-20 animate-ping top-0 left-0 -z-10"></span>

      <span>Reanudar Tutorial</span>
    </button>
  );
}

export function Home() {
  const navigate = useNavigate()
  const { payload } = useAcademicStore()
  const { estado, acciones, modales, mutacion } = useSimulationLogic()
  const queryClient = useQueryClient()

  // Tutorial con JOYRIDE
  // Tutorial con JOYRIDE (Expira en 24 horas)
  const { data: tutorialSeen = true } = useQuery({
    queryKey: ['tutorialSeen'],
    queryFn: () => {
      const savedTimestamp = localStorage.getItem('acacia_intro_seen_time')
      if (!savedTimestamp) return false // No lo ha visto nunca

      const expirationTime = parseInt(savedTimestamp, 10) + (24 * 60 * 60 * 1000) // 24 horas en milisegundos
      const now = Date.now()

      if (now > expirationTime) {
        // Ya pasaron las 24 horas: limpiamos el localStorage y forzamos a que salga de nuevo
        localStorage.removeItem('acacia_intro_seen_time')
        return false
      }

      return true // Todavía está dentro de las 24 horas de gracia
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: false,
  })

  const [runTutorial, setRunTutorial] = React.useState(false)

  const steps: Step[] = [
    {
      target: "body",
      content: "¡Bienvenido al Planificador Académico de Acacia! Te guiaremos brevemente para que sepas cómo optimizar tu plan de estudios.",
      placement: "center",
    },
    {
      target: ".quick-fill-section",
      content: "Usa este menú para marcar rápidamente semestres completos o niveles de idioma que ya tengas aprobados.",
      placement: "bottom",
    },
    {
      target: ".semester-grid-section",
      content: "Aquí puedes seleccionar o deseleccionar materias de forma individual para indicar cuáles ya aprobaste, deseas cursar o tienes pendientes.",
      placement: "top",
    },
    {
      target: ".priority-selector-section",
      content: "Agrega aquí las materias que quieres dar prioridad en el próximo semestre.",
      placement: "top",
    },
    {
      target: "button[type='submit']",
      content: "Una vez que hayas completado tu plan, presiona este botón para generar tu ruta óptima del plan de estudios hasta tu graduación.",
      placement: "top",
    }
  ]

  React.useEffect(() => {
    if (!tutorialSeen) {
      setRunTutorial(true)
    }
  }, [tutorialSeen])

  const handleJoyrideCallback = (data: any) => {
    const { status } = data
    if (status === 'finished' || status === 'skipped') {
      // Guardamos la marca de tiempo exacta del sistema actual
      localStorage.setItem('acacia_intro_seen_time', Date.now().toString())
      queryClient.setQueryData(['tutorialSeen'], true)
      setRunTutorial(false)
    }
  }

  if (mutacion.isSuccess && mutacion.data && estado.catalogoData) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 px-4">
        <GraduationTimeline
          data={mutacion.data}
          catalogo={estado.catalogoData.catalogo}
          onReset={() => mutacion.reset()}
        />
      </main>
    )
  }

  if (estado.isLoadingCatalogo) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-slate-500 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center">
            <img src={logoAcacia} alt="Logo" className="w-20 h-20 animate-pulse" />
          </div>
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-medium px-4 text-sm md:text-base">
            Cargando malla curricular desde la base de datos...
          </p>
        </div>
      </main>
    )
  }

  if (estado.isErrorCatalogo) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 p-6 rounded-2xl border border-red-200 text-center">
          <h2 className="text-red-800 font-bold text-lg">Error de Conexión</h2>
          <p className="text-red-600 mt-2 text-sm">
            No pudimos obtener el catálogo de materias. <br />
            Intenta nuevamente.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8 flex justify-center items-start">

      <JoyrideComponent
        steps={steps}
        run={runTutorial}
        continuous={true}
        showSkipButton={true}
        disableOverlayClose={true}

        spotlightClicks={false}
        callback={handleJoyrideCallback}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          skip: "Omitir tutorial",
        }}
        options={{
          showProgress: false,
          buttons: ["back", "primary", "skip"],
        }}
        tooltipComponent={TutorialTooltip}
        beaconComponent={CustomBeacon}
        disableBeacons={true}
        styles={{
          options: {
            overlayColor: "rgba(15, 23, 42, 0.75)",
            zIndex: 5000,
          },
          buttonSkip: {
            color: '#64748b',
          }
        }}
      />

      <section className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col gap-6 mt-2 md:mt-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="flex items-start gap-4">
            <div>
              <div className="inline-flex items-center border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-2 rounded-full">
                Ingeniería de Sistemas
              </div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-800 leading-tight">
                Planificador Académico
              </h1>
              <p className="text-xs md:text-base text-slate-500 mt-1">
                Selecciona tus materias aprobadas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
            <button
              type="button"
              onClick={() => navigate("/malla")}
              className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all w-full sm:w-auto"
            >
              Explorar Malla Interactiva
            </button>


            <div className="flex justify-between items-center sm:flex-col sm:items-end bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 min-w-[110px]">
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                Acumulados
              </span>
              <span className="text-xl md:text-2xl font-black text-blue-900 leading-none">
                {estado.creditosAcumulados} <span className="text-xs md:text-sm font-medium text-blue-600">cr</span>
              </span>
            </div>

          </div>
        </header>

        <form onSubmit={acciones.handleSubmit} className="flex flex-col gap-6 md:gap-8">
          <div className="quick-fill-section">
            <QuickFillMenu
              semestresAgrupados={estado.semestresAgrupados}
              quickFillOpen={estado.quickFillOpen}
              languageFillOpen={estado.languageFillOpen}
              setQuickFillOpen={acciones.setQuickFillOpen}
              setLanguageFillOpen={acciones.setLanguageFillOpen}
              aprobarHastaSemestre={acciones.aprobarHastaSemestre}
              aprobarHastaNivelIdioma={acciones.aprobarHastaNivelIdioma}
            />
          </div>

          <div className="flex justify-center items-center py-2 -my-2">
          </div>

          <div className="semester-grid-section overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <SemesterGrid
              semestresAgrupados={estado.semestresAgrupados}
              aprobadas={payload.aprobadas}
              topologia={estado.topologia}
              onToggleSemestreCompleto={acciones.toggleSemestreCompleto}
              onToggleInteligente={acciones.handleToggleInteligente}
            />
          </div>

          <hr className="border-slate-100" />

          <SimulationSettings />

          <hr className="border-slate-100" />

          <div className="priority-selector-section">
            <PrioritySelector
              materiasPrioritarias={payload.materias_prioritarias}
              catalogo={estado.catalogoData?.catalogo}
              searchTerm={estado.searchTerm}
              resultadosBusqueda={estado.resultadosBusqueda}
              onSearchChange={acciones.setSearchTerm}
              onTogglePrioridad={acciones.togglePrioridad}
            />
          </div>

          {estado.todasAprobadas && (
            <div className="p-3 bg-green-50 text-green-700 text-xs md:text-sm font-semibold rounded-lg border border-green-200 text-center">
              Has seleccionado todas las materias de la malla. ¡Ya cumples con los requisitos base para graduarte! 🎓
            </div>
          )}

          <button
            type="submit"
            disabled={mutacion.isPending || estado.todasAprobadas}
            className={`w-full text-white font-bold py-3.5 md:py-4 rounded-xl shadow-sm transition-colors text-base md:text-lg flex justify-center items-center gap-2
              ${mutacion.isPending || estado.todasAprobadas ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"}`}
          >
            {mutacion.isPending ? "Procesando..." : estado.todasAprobadas ? "Malla Completada" : "Generar Ruta Óptima"}
          </button>

          {mutacion.isError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs md:text-sm font-semibold rounded-lg border border-red-200 text-center">
              Hubo un problema de conexión con el servidor.
            </div>
          )}
        </form>
      </section>

      {modales.chainReactionNotice && <ChainReactionModal notice={modales.chainReactionNotice} onClose={() => modales.setChainReactionNotice(null)} />}
      {modales.prereqNotice && <PrereqNoticeModal notice={modales.prereqNotice} onClose={() => modales.setPrereqNotice(null)} />}
      {modales.partialSelectionNotice && <PartialSelectionModal notice={modales.partialSelectionNotice} onClose={() => modales.setPartialSelectionNotice(null)} />}
    </main>
  )
}