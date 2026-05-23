import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { useAcademicStore } from "../store/academicStore";
import { api } from "../api/client";
import { useSimulationLogic } from "../hooks/useSimulationLogic";
import { ChainReactionModal } from "./modals/ChainReactionModal";
import { PrereqNoticeModal } from "./modals/PrereqNoticeModal";
import { SemesterLimitModal } from "./modals/SemesterLimitModal";


const CustomSubjectNode = ({ data }: { data: any }) => {
  const { isAprobada, isDisponible, isDarkMode } = data;
  let nodeStyle = isDarkMode
    ? "bg-slate-950 border-slate-800 opacity-40 grayscale text-slate-500"
    : "bg-slate-100 border-slate-200 opacity-40 grayscale text-slate-400";

  let titleStyle = isDarkMode ? "text-slate-500" : "text-slate-400";

  let badge = (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isDarkMode ? "bg-slate-900 text-slate-600 border-slate-800" : "bg-slate-200 text-slate-400 border-slate-300"
      }`}>
      Sem {data.nivel}
    </span>
  );

  if (isAprobada) {
    nodeStyle = isDarkMode
      ? "bg-slate-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] opacity-100 text-green-50"
      : "bg-green-50 border-green-400 shadow-[0_2px_8px_rgba(34,197,94,0.15)] opacity-100 text-green-950";
    titleStyle = isDarkMode ? "text-green-50" : "text-green-900 font-bold";

    badge = (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isDarkMode ? "bg-green-900/50 text-green-400 border-green-700/50" : "bg-green-100 text-green-700 border-green-300"
        }`}>
        ✓ APROBADA
      </span>
    );
  } else if (isDisponible) {
    nodeStyle = isDarkMode
      ? "bg-slate-800 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.4)] opacity-100 hover:border-blue-300"
      : "bg-blue-50 border-blue-400 shadow-[0_4px_10px_rgba(59,130,246,0.15)] opacity-100 hover:border-blue-500";
    titleStyle = isDarkMode ? "text-white font-bold" : "text-blue-950 font-extrabold";
    badge = (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border animate-pulse ${isDarkMode ? "bg-blue-900/80 text-blue-300 border-blue-500" : "bg-blue-100 text-blue-700 border-blue-400"
        }`}>
        ✨ DISPONIBLE
      </span>
    );
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl border-2 transition-all duration-300 w-[240px] md:w-[260px] group cursor-pointer ${nodeStyle}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? "bg-slate-800 border-slate-500" : "bg-white border-slate-400"}`}
      />

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-black tracking-widest uppercase ${isAprobada ? "text-green-500" : isDisponible ? "text-blue-500" : isDarkMode ? "text-slate-700" : "text-slate-400"
            }`}>
            {data.id || "COD"}
          </span>
          {badge}
        </div>

        <h3 className={`text-sm leading-tight mt-1 transition-colors ${titleStyle}`}>
          {data.label}
        </h3>

        <p className={`text-xs font-medium ${isAprobada || isDisponible
          ? isDarkMode ? "text-slate-400" : "text-slate-600"
          : isDarkMode ? "text-slate-700" : "text-slate-400"
          }`}>
          {data.creditos} cr • {data.tipo}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? "bg-slate-800 border-slate-500" : "bg-white border-slate-400"}`}
      />
    </div>
  );
};

const nodeTypes = { customSubject: CustomSubjectNode };

export function GrafoInteractivo() {
  const navigate = useNavigate();
  const { payload } = useAcademicStore();
  const aprobadas = payload.aprobadas;
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [nodosMovibles, setNodosMovibles] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { estado, acciones, modales } = useSimulationLogic();

  const { data: graphResponse, isLoading: isLoadingGrafo } = useQuery({
    queryKey: ["grafo-curricular"],
    queryFn: () => fetch("/api/v1/malla-visual").then((res) => res.json()),
  });

  const payloadConCreditos = useMemo(
    () => ({
      ...payload,
      creditos_acumulados: estado.creditosAcumulados,
    }),
    [payload, estado.creditosAcumulados],
  );

  const { data: disponiblesResponse } = useQuery({
    queryKey: ["materias-disponibles", aprobadas, estado.creditosAcumulados],
    queryFn: () => api.getDisponibles(payloadConCreditos),
    enabled: !!graphResponse,
  });

  const codigosDisponibles = useMemo(() => {
    if (!disponiblesResponse?.disponibles) return [];

    return disponiblesResponse.disponibles.map((m: any) => m.codigo);
  }, [disponiblesResponse]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const descargarMallaComoImagen = async () => {
    if (!nodes.length) {
      alert("No hay materias para exportar.");
      return;
    }

    const viewport = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!viewport) {
      alert("No se encontró la malla para exportar.");
      return;
    }

    try {
      setIsExportingImage(true);
      const imageWidth = 3840;
      const imageHeight = 2160;
      const nodesBounds = getNodesBounds(nodes);
      const transform = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.3, 2, 0.15);
      const dataUrl = await toPng(viewport, {
        backgroundColor: isDarkMode ? "#0b0f14" : "#f8fafc",
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2,
        cacheBust: true,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        },
      });
      const link = document.createElement("a");
      link.download = `malla-interactiva-${isDarkMode ? "dark" : "light"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exportando la malla:", error);
      alert("No se pudo guardar la imagen de la malla.");
    } finally {
      setIsExportingImage(false);
    }
  };

  useEffect(() => {
    if (graphResponse?.grafo) {
      const materiasPorSemestre: Record<number, any[]> = {};

      const CODIGO_PRACTICA = "PML4130";

      const rawNodes = graphResponse.grafo.nodes.filter((n: any) => n.id !== CODIGO_PRACTICA);
      const rawEdges = graphResponse.grafo.edges.filter(
        (e: any) => e.source !== CODIGO_PRACTICA && e.target !== CODIGO_PRACTICA
      );

      rawNodes.forEach((node: any) => {
        const nivel = node.data.nivel || 1;
        if (!materiasPorSemestre[nivel]) materiasPorSemestre[nivel] = [];
        materiasPorSemestre[nivel].push(node);
      });

      const columnSpacing = isMobile ? 260 : 310;
      const rowSpacing = isMobile ? 110 : 130;
      const yInglesfijo = isMobile ? 750 : 880;

      const positionedNodes: Node[] = rawNodes.map((node: any) => {
        const nivel = node.data.nivel || 1;
        const materiasEnEsteSemestre = materiasPorSemestre[nivel];
        const materiasSinIngles = materiasEnEsteSemestre.filter((n) => !n.id.startsWith("IGL"));
        const indexSinIngles = materiasSinIngles.findIndex((n: any) => n.id === node.id);

        let finalY: number;

        if (node.id.startsWith("IGL")) {
          finalY = yInglesfijo;
        } else {
          finalY = indexSinIngles * rowSpacing;
        }

        return {
          id: node.id,
          type: "customSubject",
          data: {
            ...node.data,
            id: node.id,
            isAprobada: aprobadas.includes(node.id),
            isDisponible: codigosDisponibles.includes(node.id),
            isDarkMode,
          },

          position: {
            x: (nivel - 1) * columnSpacing,
            y: finalY,
          },
        };
      });

      const styledEdges: Edge[] = rawEdges.map((edge: any) => ({
        ...edge,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: isDarkMode ? "#3b82f6" : "#2563eb",
          strokeWidth: isMobile ? 1.2 : 1.8,
          opacity: isDarkMode ? 0.35 : 0.45
        },
      }));

      setNodes(positionedNodes);
      setEdges(styledEdges);
    }
  }, [graphResponse, aprobadas, codigosDisponibles, isDarkMode, isMobile, setNodes, setEdges]);


  useEffect(() => {
    setNodes((nodosActuales) =>
      nodosActuales.map((nodo) => ({
        ...nodo,
        data: {
          ...nodo.data,
          isAprobada: aprobadas.includes(nodo.id),
          isDisponible: codigosDisponibles.includes(nodo.id),
          isDarkMode,
        }
      }))
    );
  }, [aprobadas, codigosDisponibles, isDarkMode, setNodes]);

  if (isLoadingGrafo) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center text-sm font-bold ${isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-800"}`}>
        Cargando Malla Curricular...
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0f172a]" : "bg-slate-50"}`}>
      <header className={`p-4 border-b flex flex-col gap-3 md:flex-row md:justify-between md:items-center z-10 shadow-md ${isDarkMode ? "bg-slate-900/90 border-slate-800/80" : "bg-white/95 border-slate-200"
        } backdrop-blur-md`}>
        <div>
          <h1 className={`font-black text-lg md:text-xl tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            Malla Interactiva
          </h1>
          <p className="text-blue-500 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
            Vista de Correlativas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl text-sm font-bold shadow-sm border transition-all active:scale-95 flex items-center justify-center ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDarkMode ? "☀️ Claro" : "🌙 Oscuro"}
          </button>

          <button
            type="button"
            onClick={() => setNodosMovibles(!nodosMovibles)}
            className={`px-3 py-2.5 flex-1 sm:flex-initial rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95 border ${nodosMovibles
              ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-[0_0_12px_rgba(217,119,6,0.3)]"
              : isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
              }`}
          >
            {nodosMovibles ? "🔓 Bloquear Nodos" : "🔒 Mover Nodos"}
          </button>

          <button
            type="button"
            onClick={descargarMallaComoImagen}
            disabled={isExportingImage}
            className={`px-3 py-2.5 flex-1 sm:flex-initial border text-xs md:text-sm rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
              ? "bg-slate-700 hover:bg-slate-600 border-blue-400/30 text-white"
              : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
              }`}
          >
            {isExportingImage ? "Generando..." : "Guardar Imagen"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all active:scale-95 text-center"
          >
            ← Volver al Planificador
          </button>
        </div>
      </header>

      {/* ÁREA DEL LIENZO INTERACTIVO */}
      <div className="flex-grow w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => {
            acciones.handleToggleInteligente(node.id, true);
          }}

          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: isMobile ? 0.1 : 0.2 }} // Más ajustado en móviles
          colorMode={isDarkMode ? "dark" : "light"} // ← Configuración nativa de React Flow para Modo Claro
          minZoom={0.15}
          maxZoom={1.5}
          nodesDraggable={nodosMovibles}
          nodesConnectable={false}
          panOnDrag={true}
        >

          <Background
            color={isDarkMode ? "#1e293b" : "#cbd5e1"}
            gap={isMobile ? 20 : 24}
            size={1}
          />

          {!isMobile && (
            <Controls
              showInteractive={false}
              className={`shadow-md border ${isDarkMode ? "bg-slate-800 border-slate-700 fill-white" : "bg-white border-slate-200 fill-slate-800"}`}
            />
          )}

          {!isMobile && (
            <MiniMap
              nodeColor={(n) => {
                if (n.data.isAprobada) return "#16a34a";
                if (n.data.isDisponible) return "#2563eb";
                return isDarkMode ? "#1e293b" : "#e2e8f0";
              }}
              maskColor={isDarkMode ? "rgba(15, 23, 42, 0.85)" : "rgba(241, 245, 249, 0.8)"}
              className={`border rounded-lg overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}`}
            />
          )}
        </ReactFlow>
      </div>

      {modales.chainReactionNotice && (
        <ChainReactionModal
          notice={modales.chainReactionNotice}
          onClose={() => modales.setChainReactionNotice(null)}
        />
      )}

      {modales.prereqNotice && (
        <PrereqNoticeModal
          notice={modales.prereqNotice}
          onClose={() => modales.setPrereqNotice(null)}
        />
      )}

      {modales.semesterLimitNotice && (
        <SemesterLimitModal
          {...modales.semesterLimitNotice}
          onClose={() => modales.setSemesterLimitNotice(null)}
        />
      )}
    </div>
  );
}
